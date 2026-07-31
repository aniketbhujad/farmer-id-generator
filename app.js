/* 
   Farmer ID Card Generator - Core Application Script
   Handles modal states, dynamic table rows, canvas drawing, QR code rendering, and PDF exports.
*/

// Application State
let isGenerated = false;
let uploadedPhotoSrc = null;
let frontTemplate = null;
let backTemplate = null;
let landRowCount = 0;

// Element Selectors
const consentModal = document.getElementById('consentModal');
const acceptCheckbox = document.getElementById('acceptCheckbox');
const btnAgree = document.getElementById('btnAgree');
const btnDisagree = document.getElementById('btnDisagree');

const paymentOverlay = document.getElementById('paymentOverlay');
const paymentSpinner = document.getElementById('paymentSpinner');
const paymentSuccess = document.getElementById('paymentSuccess');
const paymentTitle = document.getElementById('paymentTitle');
const paymentDesc = document.getElementById('paymentDesc');

const farmerForm = document.getElementById('farmerForm');
const nameEngInput = document.getElementById('nameEng');
const nameLocalInput = document.getElementById('nameLocal');
const dobInput = document.getElementById('dob');
const genderInput = document.getElementById('gender');
const mobileInput = document.getElementById('mobile');
const aadhaarInput = document.getElementById('aadhaar');
const farmerIdInput = document.getElementById('farmerId');
const farmerPhotoInput = document.getElementById('farmerPhoto');
const fileNameDisplay = document.getElementById('fileNameDisplay');

// Address fields selectors (Fix #4)
const villageInput = document.getElementById('addrVillage');
const tehsilInput = document.getElementById('addrTehsil');
const districtInput = document.getElementById('addrDistrict');
const pincodeInput = document.getElementById('addrPincode');

const btnAddLandRow = document.getElementById('btnAddLandRow');
const landTableBody = document.getElementById('landTableBody');

const btnGenerateCard = document.getElementById('btnGenerateCard');
const btnUpdateCard = document.getElementById('btnUpdateCard');
const btnCancel = document.getElementById('btnCancel');
const btnBackHome = document.getElementById('btnBackHome');

const downloadControls = document.getElementById('downloadControls');
const noPreviewPlaceholder = document.getElementById('noPreviewPlaceholder');
const frontWrapper = document.getElementById('frontWrapper');
const backWrapper = document.getElementById('backWrapper');

const langSelector = document.getElementById('langSelector');
const templateSelector = document.getElementById('templateSelector');

const btnDownloadA4 = document.getElementById('btnDownloadA4');
const btnDownload4x6 = document.getElementById('btnDownload4x6');
const btnDownloadPng = document.getElementById('btnDownloadPng');

// --- Image Cropper State & Elements (Fix #5) ---
let cropImageObj = null;
let cropZoom = 1.0;
let cropX = 0;
let cropY = 0;
let isDraggingCrop = false;
let dragStartX = 0;
let dragStartY = 0;

const cropModal = document.getElementById('cropModal');
const cropCanvas = document.getElementById('cropCanvas');
const cropCtx = cropCanvas.getContext('2d');
const cropZoomRange = document.getElementById('cropZoomRange');
const btnCropZoomOut = document.getElementById('btnCropZoomOut');
const btnCropZoomIn = document.getElementById('btnCropZoomIn');
const btnCropCancel = document.getElementById('btnCropCancel');
const btnCropSave = document.getElementById('btnCropSave');
const cropContainer = document.getElementById('cropContainer');

// --- Initialization ---
window.onload = async () => {
    // Show consent modal on load
    consentModal.classList.add('active');

    // Add default row matching screenshot values
    addLandRow('Ahilyanagar', 'nagar', 'kedgaon', '12', '22', '0.042000');

    // Default address inputs are left empty to display the placeholders
    villageInput.value = '';
    tehsilInput.value = '';
    districtInput.value = '';
    pincodeInput.value = '';

    // Preload background templates
    try {
        await loadTemplates();
        console.log('Templates preloaded successfully.');
    } catch (err) {
        console.error('Error loading background templates:', err);
        alert('Warning: Could not load the card background templates from the "assests/" directory. Please check that "farmer-id-front.png" and "farmer-id-back.png" exist in the workspace under "assests/".');
    }
};

// --- Preload Templates Logic ---
function loadTemplates() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const total = 2;

        function checkLoad() {
            loadedCount++;
            if (loadedCount === total) {
                resolve();
            }
        }

        function handleError(e) {
            reject(e);
        }

        frontTemplate = new Image();
        frontTemplate.onload = checkLoad;
        frontTemplate.onerror = handleError;
        frontTemplate.src = TEMPLATE_FRONT_B64;

        backTemplate = new Image();
        backTemplate.onload = checkLoad;
        backTemplate.onerror = handleError;
        backTemplate.src = TEMPLATE_BACK_B64;
    });
}

// --- Consent Modal Event Listeners ---
acceptCheckbox.addEventListener('change', () => {
    btnAgree.disabled = !acceptCheckbox.checked;
});

btnAgree.addEventListener('click', () => {
    consentModal.classList.remove('active');
});

btnDisagree.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});

// --- Formatting Inputs (No auto-preview to prevent lags - Fix #7) ---

// Format Aadhaar: XXXX XXXX XXXX
aadhaarInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Digits only
    if (val.length > 12) {
        val = val.substring(0, 12);
    }
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) {
            formatted += ' ';
        }
        formatted += val[i];
    }
    e.target.value = formatted;
});

// Mobile Number: 10 Digits
mobileInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
});

// Farmer ID: Exactly 11 Digits Validation (Fix #2)
farmerIdInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
});

// Pincode: 6 Digits
pincodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
});

// Format DOB: DD/MM/YYYY
dobInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) {
        val = val.substring(0, 8);
    }
    let formatted = '';
    if (val.length > 0) {
        formatted += val.substring(0, 2);
    }
    if (val.length > 2) {
        formatted += '/' + val.substring(2, 4);
    }
    if (val.length > 4) {
        formatted += '/' + val.substring(4, 8);
    }
    e.target.value = formatted;
});

// --- Photo Upload with Cropping Interaction (Fix #5) ---
farmerPhotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                cropImageObj = img;
                cropZoom = 1.0;
                cropZoomRange.value = 1.0;

                // Center the image inside the 350x350 crop canvas container
                cropX = 175 - (img.width * cropZoom) / 2;
                cropY = 175 - (img.height * cropZoom) / 2;

                cropModal.classList.add('active');
                drawCropPreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = 'No file chosen';
        uploadedPhotoSrc = null;
    }
});

function drawCropPreview() {
    if (!cropImageObj) return;
    cropCtx.clearRect(0, 0, 350, 350);
    const w = cropImageObj.width * cropZoom;
    const h = cropImageObj.height * cropZoom;
    cropCtx.drawImage(cropImageObj, cropX, cropY, w, h);
}

// Drag logic on crop container
cropContainer.addEventListener('mousedown', (e) => {
    isDraggingCrop = true;
    dragStartX = e.clientX - cropX;
    dragStartY = e.clientY - cropY;
    cropContainer.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
    if (!isDraggingCrop) return;
    cropX = e.clientX - dragStartX;
    cropY = e.clientY - dragStartY;
    drawCropPreview();
});

window.addEventListener('mouseup', () => {
    isDraggingCrop = false;
    cropContainer.style.cursor = 'move';
});

// Touch controls for mobile cropping
cropContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        isDraggingCrop = true;
        dragStartX = e.touches[0].clientX - cropX;
        dragStartY = e.touches[0].clientY - cropY;
    }
});

cropContainer.addEventListener('touchmove', (e) => {
    if (!isDraggingCrop || e.touches.length !== 1) return;
    e.preventDefault();
    cropX = e.touches[0].clientX - dragStartX;
    cropY = e.touches[0].clientY - dragStartY;
    drawCropPreview();
});

cropContainer.addEventListener('touchend', () => {
    isDraggingCrop = false;
});

// Crop zoom slider
cropZoomRange.addEventListener('input', (e) => {
    const oldZoom = cropZoom;
    cropZoom = parseFloat(e.target.value);

    // Zoom centered relative to canvas midpoint (175, 175)
    const centerX = 175;
    const centerY = 175;
    cropX = centerX - (centerX - cropX) * (cropZoom / oldZoom);
    cropY = centerY - (centerY - cropY) * (cropZoom / oldZoom);

    drawCropPreview();
});

btnCropZoomOut.addEventListener('click', () => {
    let val = parseFloat(cropZoomRange.value);
    val = Math.max(parseFloat(cropZoomRange.min), val - 0.1);
    cropZoomRange.value = val;
    cropZoomRange.dispatchEvent(new Event('input'));
});

btnCropZoomIn.addEventListener('click', () => {
    let val = parseFloat(cropZoomRange.value);
    val = Math.min(parseFloat(cropZoomRange.max), val + 0.1);
    cropZoomRange.value = val;
    cropZoomRange.dispatchEvent(new Event('input'));
});

btnCropCancel.addEventListener('click', () => {
    cropModal.classList.remove('active');
    farmerPhotoInput.value = '';
    fileNameDisplay.textContent = 'No file chosen';
    cropImageObj = null;
});

btnCropSave.addEventListener('click', () => {
    if (!cropImageObj) return;

    // Output target: 330x390 size matching photo frame aspect ratio
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 330;
    tempCanvas.height = 390;
    const tempCtx = tempCanvas.getContext('2d');

    // Green Crop frame in cropCanvas is centered (180w x 213h), coordinates: x=85, y=68
    tempCtx.drawImage(cropCanvas, 85, 68, 180, 214, 0, 0, 330, 390);

    uploadedPhotoSrc = tempCanvas.toDataURL('image/png');
    cropModal.classList.remove('active');

    // Trigger preview update if the card is already generated
    if (isGenerated) {
        renderCardPreviews();
    }
});

// --- Land Table Dynamic Controls (Fix #3: Max 5 rows limit) ---
function updateAddRowButtonState() {
    const currentRows = landTableBody.querySelectorAll('tr').length;
    if (currentRows >= 5) {
        btnAddLandRow.disabled = true;
        btnAddLandRow.style.opacity = '0.5';
        btnAddLandRow.style.cursor = 'not-allowed';
    } else {
        btnAddLandRow.disabled = false;
        btnAddLandRow.style.opacity = '1';
        btnAddLandRow.style.cursor = 'pointer';
    }
}

btnAddLandRow.addEventListener('click', () => {
    const currentRows = landTableBody.querySelectorAll('tr').length;
    if (currentRows >= 5) {
        alert("Maximum of 5 land records can be added.");
        return;
    }
    addLandRow();
});

function addLandRow(state = '', subDist = '', vill = '', sNo = '', ss = '', area = '') {
    landRowCount++;
    const tr = document.createElement('tr');
    tr.id = `land-row-${landRowCount}`;
    tr.innerHTML = `
        <td><input type="text" class="form-control state-input" value="${state}" placeholder="Ahilyanagar" required></td>
        <td><input type="text" class="form-control subdist-input" value="${subDist}" placeholder="nagar" required></td>
        <td><input type="text" class="form-control vill-input" value="${vill}" placeholder="kedgaon" required></td>
        <td><input type="text" class="form-control gata-input" value="${sNo}" placeholder="12" required></td>
        <td><input type="text" class="form-control survey-input" value="${ss}" placeholder="22" required></td>
        <td><input type="number" step="0.000001" class="form-control area-input" value="${area}" placeholder="0.042000" required></td>
        <td style="text-align: center;">
            <button type="button" class="btn-delete-row" onclick="deleteLandRow(${landRowCount})">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
        </td>
    `;
    landTableBody.appendChild(tr);
    lucide.createIcons();
    updateAddRowButtonState();
}

function deleteLandRow(rowId) {
    const row = document.getElementById(`land-row-${rowId}`);
    if (row) {
        row.remove();
        updateAddRowButtonState();
    }
}

// --- Card Drawing Logic ---

// Helper function to draw rounded rectangles compatible with all browsers
function drawRoundRect(ctx, x, y, width, height, radius, fill = true, stroke = false) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (const side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// Helper function to crop images (object-fit: cover) into canvas boxes
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    const iw = img.width, ih = img.height;
    const r = Math.min(w / iw, h / ih);
    let nw = iw * r, nh = ih * r, cx, cy, cw, ch;
    if (nw < w) {
        const scale = w / nw;
        nw *= scale;
        nh *= scale;
    }
    if (nh < h) {
        const scale = h / nh;
        nw *= scale;
        nh *= scale;
    }
    cx = (iw - (w / (nw / iw))) * offsetX;
    cy = (ih - (h / (nh / ih))) * offsetY;
    cw = iw - cx * 2;
    ch = ih - cy * 2;
    if (cx < 0) { cx = 0; cw = iw; }
    if (cy < 0) { cy = 0; ch = ih; }
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

// Helper function to draw user avatar silhouette placeholder
function drawPhotoPlaceholder(ctx, x, y, w, h) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 3.2, w / 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.95, w / 2.2, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NO PHOTO', x + w / 2, y + h * 0.72);
}

// Helper to wrap text dynamically inside canvas
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
}

// Helper function to render a secure QR code (using QRious with UTF-8 byte sequence encoding)
function getQRCodeImage(text) {
    return new Promise((resolve) => {
        try {
            // Create an in-memory canvas
            const canvas = document.createElement('canvas');

            // Convert standard string into a UTF-8 byte sequence string
            const utf8EncodedText = unescape(encodeURIComponent(text));

            // Generate QR code using QRious
            new QRious({
                element: canvas,
                value: utf8EncodedText,
                size: 300,
                level: 'M'
            });

            // Load into Image object
            const qrImage = new Image();
            qrImage.onload = () => resolve(qrImage);
            qrImage.onerror = () => resolve(null);
            qrImage.src = canvas.toDataURL('image/png');
        } catch (error) {
            console.error("QRious Generation Error:", error);
            resolve(null);
        }
    });
}

// Core rendering function
async function renderCardPreviews() {
    try {
        if (!frontTemplate || !backTemplate) return;

        const frontCanvas = document.getElementById('frontCanvas');
        const backCanvas = document.getElementById('backCanvas');
        const fCtx = frontCanvas.getContext('2d');
        const bCtx = backCanvas.getContext('2d');

        fCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
        bCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

        fCtx.drawImage(frontTemplate, 0, 0);
        bCtx.drawImage(backTemplate, 0, 0);

        // --- FRONT SIDE DETAILS ---

        // 1. Draw Farmer Photo (using final cropped image if available)
        if (uploadedPhotoSrc) {
            const userImg = new Image();
            userImg.src = uploadedPhotoSrc;
            await new Promise((resolve) => {
                userImg.onload = resolve;
                userImg.onerror = resolve;
            });

            if (userImg.width > 0) {
                drawImageProp(fCtx, userImg, 75, 240, 330, 390);
                fCtx.strokeStyle = '#000000';
                fCtx.lineWidth = 4;
                fCtx.strokeRect(75, 240, 330, 390);
            } else {
                drawPhotoPlaceholder(fCtx, 75, 240, 330, 390);
            }
        } else {
            drawPhotoPlaceholder(fCtx, 75, 240, 330, 390);
        }

        fCtx.textAlign = 'left';
        fCtx.textBaseline = 'alphabetic';

        // 2. Name English
        fCtx.fillStyle = '#000000';
        fCtx.font = 'bold 46px "Inter", sans-serif';
        fCtx.fillText(nameEngInput.value || 'Farmer Name', 440, 250);

        // 3. Name Local
        fCtx.fillStyle = '#15803d';
        fCtx.font = 'bold 40px "Inter", sans-serif';
        fCtx.fillText(nameLocalInput.value, 440, 305);

        // 4. Draw Details Block with Bilingual labels (Fix #8)
        const labelX = 440;
        const valOffset = 860; // offset shifted right to leave space for longer labels
        fCtx.font = 'bold 34px "Inter", sans-serif';

        // DOB
        fCtx.fillStyle = '#475569';
        fCtx.fillText('जन्म दिनांक / DOB :', labelX, 385);
        fCtx.fillStyle = '#000000';
        fCtx.fillText(dobInput.value || '01/01/1970', valOffset, 385);

        // Gender
        fCtx.fillStyle = '#475569';
        fCtx.fillText('लिंग / Gender :', labelX, 445);
        fCtx.fillStyle = '#000000';
        fCtx.fillText(genderInput.value || 'Male', valOffset, 445);

        // Mobile
        fCtx.fillStyle = '#475569';
        fCtx.fillText('मोबाईल / Mobile :', labelX, 505);
        fCtx.fillStyle = '#000000';
        fCtx.fillText(mobileInput.value || '1234567890', valOffset, 505);

        // Aadhaar
        fCtx.fillStyle = '#475569';
        fCtx.fillText('आधार नं / Aadhaar No :', labelX, 565);
        fCtx.fillStyle = '#000000';
        fCtx.fillText(aadhaarInput.value || '1234 5432 5678', valOffset, 565);

        // Combine address for display and QR code (Fix #4)
        const combinedAddress = `${villageInput.value || 'Village'}, ${tehsilInput.value || 'Tehsil'}, ${districtInput.value || 'District'} - ${pincodeInput.value || '123456'}`;

        // Loop to build Land details text for QR code (Fix #1 - Compact format to prevent overflow)
        let landRecordsQrText = '';
        const tbodyRows = landTableBody.querySelectorAll('tr');
        tbodyRows.forEach((row, index) => {
            const state = row.querySelector('.state-input').value || '-';
            const subdist = row.querySelector('.subdist-input').value || '-';
            const vill = row.querySelector('.vill-input').value || '-';
            const gata = row.querySelector('.gata-input').value || '-';
            const survey = row.querySelector('.survey-input').value || '-';
            const area = row.querySelector('.area-input').value || '-';
            landRecordsQrText += ` | R${index + 1}: ${state}, ${subdist}, ${vill}, Gat:${gata}, Khata:${survey}, Area:${area}`;
        });

        // 5. Draw Secure QR Code containing full profile (Fix #1 - Compact format)
        const secureQrString = `FID: ${farmerIdInput.value || '12345678901'}
Name: ${nameEngInput.value || 'Farmer Name'}
DOB: ${dobInput.value || '01/01/1970'}
Gender: ${genderInput.value || 'Male'}
Mobile: ${mobileInput.value || '1234567890'}
Aadhaar: ${aadhaarInput.value || '1234 5432 5678'}
Addr: ${combinedAddress}
Land:${landRecordsQrText || ' None'}`;

        const qrImg = await getQRCodeImage(secureQrString);
        if (qrImg) {
            fCtx.fillStyle = '#ffffff';
            fCtx.strokeStyle = '#cbd5e1';
            fCtx.lineWidth = 3;
            drawRoundRect(fCtx, 1150, 330, 330, 330, 16, true, true);
            fCtx.drawImage(qrImg, 1165, 345, 300, 300);
        }

        // 6. Draw Farmer ID Rounded Capsule (Centered horizontally to show tractor graphic - Fix #6)
        fCtx.fillStyle = '#ffffff';
        fCtx.strokeStyle = '#e2e8f0';
        fCtx.lineWidth = 4;
        drawRoundRect(fCtx, 430, 680, 700, 100, 50, true, true); // Width=700 centered in 1561 width: x=(1561-700)/2 = 430

        fCtx.textAlign = 'center';
        fCtx.fillStyle = '#000000';
        fCtx.font = 'bold 38px "Outfit", sans-serif';
        fCtx.fillText(`Farmer Id: ${farmerIdInput.value || '12345678901'}`, 430 + 700 / 2, 680 + 63);


        // --- BACK SIDE DETAILS ---

        bCtx.textAlign = 'left';
        bCtx.textBaseline = 'alphabetic';

        // 1. Draw Address (Bilingual layout and styling - Fix #8)
        bCtx.fillStyle = '#166534'; // Green title
        bCtx.font = 'bold 36px "Inter", sans-serif';
        bCtx.fillText('संपूर्ण पत्ता / Address', 80, 205);

        bCtx.fillStyle = '#000000';
        bCtx.font = '500 32px "Inter", sans-serif';
        wrapText(bCtx, combinedAddress, 80, 255, 1389, 45);

        // 2. Draw Land Details Table (Fix #8 headers & shifted position)
        const startTableY = 390;
        const colWidths = [231, 231, 231, 232, 232, 232];

        // Bilingual headers (jilha / district, taluka / sub dist., gaon / village, gat no. / gate no., khate no. / survey no., area)
        const colHeaders = [
            'जिल्हा / District',
            'तालुका / Sub Dist.',
            'गाव / Village',
            'गट नं. / Gat No.',
            'खाते नं. / Survey No.',
            'क्षेत्र / Area'
        ];
        const tableTitle = 'जमिनीची माहिती / Land Details';

        // Draw Table Title
        bCtx.fillStyle = '#166534';
        bCtx.font = 'bold 36px "Inter", sans-serif';
        bCtx.fillText(tableTitle, 80, startTableY - 20);

        // Table Header Background (Light gray-green)
        bCtx.fillStyle = '#f1f5f9';
        bCtx.fillRect(80, startTableY, 1389, 80);

        // Outer Table Borders
        bCtx.strokeStyle = '#cbd5e1';
        bCtx.lineWidth = 2;
        bCtx.strokeRect(80, startTableY, 1389, 80);

        // Fill Column Titles
        let currentX = 80;
        bCtx.fillStyle = '#374151';
        bCtx.font = 'bold 20px "Inter", sans-serif'; // Reduced font size to prevent bilingual text overflow inside the 231px wide cells
        bCtx.textAlign = 'center';

        for (let i = 0; i < colHeaders.length; i++) {
            const textX = currentX + colWidths[i] / 2;
            bCtx.fillText(colHeaders[i], textX, startTableY + 50);

            // Vert divider in header
            if (i < colHeaders.length - 1) {
                bCtx.beginPath();
                bCtx.moveTo(currentX + colWidths[i], startTableY);
                bCtx.lineTo(currentX + colWidths[i], startTableY + 80);
                bCtx.stroke();
            }
            currentX += colWidths[i];
        }

        // Populate table rows
        let currentY = startTableY + 80;

        if (tbodyRows.length === 0) {
            drawTableRow(bCtx, ['-', '-', '-', '-', '-', '-'], currentY, colWidths, '#ffffff');
            currentY += 70;
        } else {
            tbodyRows.forEach((row, index) => {
                const state = row.querySelector('.state-input').value || '-';
                const subdist = row.querySelector('.subdist-input').value || '-';
                const vill = row.querySelector('.vill-input').value || '-';
                const gata = row.querySelector('.gata-input').value || '-';
                const survey = row.querySelector('.survey-input').value || '-';
                const area = row.querySelector('.area-input').value || '-';

                const rowData = [state, subdist, vill, gata, survey, area];
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

                drawTableRow(bCtx, rowData, currentY, colWidths, bgColor);
                currentY += 70;
            });
        }
    } catch (e) {
        console.error("Rendering error:", e);
        alert("Error during card rendering: " + e.message + "\nStack: " + e.stack);
    }
}

// Helper to draw a single row on the card table
function drawTableRow(ctx, data, y, colWidths, bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(80, y, 1389, 70);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.strokeRect(80, y, 1389, 70);

    let currentX = 80;
    ctx.fillStyle = '#1f2937';
    ctx.font = '26px "Inter", sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i < data.length; i++) {
        const textX = currentX + colWidths[i] / 2;
        ctx.fillText(data[i], textX, y + 43);

        if (i < data.length - 1) {
            ctx.beginPath();
            ctx.moveTo(currentX + colWidths[i], y);
            ctx.lineTo(currentX + colWidths[i], y + 70);
            ctx.stroke();
        }
        currentX += colWidths[i];
    }
}

// --- Form Validation Helpers (Fix: Red/Green Validation States & Inline Messages) ---
function setValidationState(inputEl, isValid, message = '') {
    if (!inputEl) return;

    inputEl.classList.remove('is-valid', 'is-invalid');
    inputEl.classList.add(isValid ? 'is-valid' : 'is-invalid');

    // For table cell inputs, we only add border coloring to avoid breaking the row structure
    if (inputEl.classList.contains('form-control') && inputEl.closest('td')) {
        return;
    }

    const parent = inputEl.closest('.form-group');
    if (!parent) return;

    const existingError = parent.querySelector('.error-msg');
    if (existingError) {
        existingError.remove();
    }

    if (!isValid && message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '4px';
        errorDiv.style.fontWeight = '500';
        errorDiv.textContent = message;
        parent.appendChild(errorDiv);
    }
}

function setPhotoValidationState(isValid, message = '') {
    const wrapper = document.querySelector('.file-upload-wrapper');
    const parent = wrapper ? wrapper.closest('.form-group') : null;
    if (!wrapper || !parent) return;

    wrapper.classList.remove('is-valid', 'is-invalid');
    wrapper.classList.add(isValid ? 'is-valid' : 'is-invalid');

    const existingError = parent.querySelector('.error-msg');
    if (existingError) {
        existingError.remove();
    }

    if (!isValid && message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontSize = '0.85rem';
        errorDiv.style.marginTop = '4px';
        errorDiv.style.fontWeight = '500';
        errorDiv.textContent = message;
        parent.appendChild(errorDiv);
    }
}

function validateFarmerDetails() {
    let isValid = true;
    let firstInvalidInput = null;

    function checkField(inputEl, condition, errorMsg) {
        if (!condition) {
            setValidationState(inputEl, false, errorMsg);
            isValid = false;
            if (!firstInvalidInput) {
                firstInvalidInput = inputEl;
            }
        } else {
            setValidationState(inputEl, true);
        }
    }

    // 1. Farmer Name English
    checkField(nameEngInput, nameEngInput.value.trim() !== '', "Name in English is required.");

    // 2. DOB full date format (DD/MM/YYYY)
    const dobVal = dobInput.value;
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    checkField(dobInput, dobVal.length === 10 && dateRegex.test(dobVal), "DOB must be in DD/MM/YYYY format.");

    // 3. Mobile number (exactly 10 digits)
    checkField(mobileInput, mobileInput.value.length === 10, "Mobile number must be exactly 10 digits.");

    // 4. Farmer ID (exactly 11 digits)
    checkField(farmerIdInput, farmerIdInput.value.length === 11, "Farmer ID must be exactly 11 digits.");

    // 5. Aadhaar (exactly 12 digits, raw length)
    const rawAadhaar = aadhaarInput.value.replace(/\s/g, '');
    checkField(aadhaarInput, rawAadhaar.length === 12, "Aadhaar must be exactly 12 digits.");

    // 6. Farmer Photo (Compulsory)
    if (!uploadedPhotoSrc) {
        setPhotoValidationState(false, "Farmer profile photo is compulsory.");
        isValid = false;
        if (!firstInvalidInput) {
            firstInvalidInput = farmerPhotoInput;
        }
    } else {
        setPhotoValidationState(true);
    }

    // 7. Village
    checkField(villageInput, villageInput.value.trim() !== '' && villageInput.value.length <= 50,
        villageInput.value.trim() === '' ? "Village name is required." : "Village name must not exceed 50 characters.");

    // 8. Tehsil
    checkField(tehsilInput, tehsilInput.value.trim() !== '' && tehsilInput.value.length <= 25,
        tehsilInput.value.trim() === '' ? "Tehsil/Taluka is required." : "Tehsil/Taluka must not exceed 25 characters.");

    // 9. District
    checkField(districtInput, districtInput.value.trim() !== '' && districtInput.value.length <= 25,
        districtInput.value.trim() === '' ? "District is required." : "District must not exceed 25 characters.");

    // 10. Pincode
    checkField(pincodeInput, pincodeInput.value.length === 6, "Pincode must be exactly 6 digits.");

    // 11. Land details table inputs validation
    const landRows = landTableBody.querySelectorAll('tr');
    if (landRows.length === 0) {
        alert("At least one land details record is required.");
        isValid = false;
    } else {
        for (let i = 0; i < landRows.length; i++) {
            const row = landRows[i];
            const state = row.querySelector('.state-input');
            const subdist = row.querySelector('.subdist-input');
            const vill = row.querySelector('.vill-input');
            const gata = row.querySelector('.gata-input');
            const survey = row.querySelector('.survey-input');
            const area = row.querySelector('.area-input');

            checkField(state, state.value.trim() !== '', "Required");
            checkField(subdist, subdist.value.trim() !== '', "Required");
            checkField(vill, vill.value.trim() !== '', "Required");
            checkField(gata, gata.value.trim() !== '', "Required");
            checkField(survey, survey.value.trim() !== '', "Required");
            checkField(area, area.value.trim() !== '', "Required");
        }
    }

    if (!isValid && firstInvalidInput) {
        if (firstInvalidInput !== farmerPhotoInput) {
            firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidInput.focus();
        } else {
            farmerPhotoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

btnGenerateCard.addEventListener('click', async () => {
    if (!validateFarmerDetails()) {
        return;
    }

    isGenerated = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    noPreviewPlaceholder.style.display = 'none';
    frontWrapper.style.display = 'block';
    backWrapper.style.display = 'block';
    downloadControls.style.display = 'flex';

    btnGenerateCard.style.display = 'none';
    btnUpdateCard.style.display = 'inline-flex';

    await renderCardPreviews();
});

btnUpdateCard.addEventListener('click', async () => {
    if (!validateFarmerDetails()) {
        return;
    }

    await renderCardPreviews();
    alert('Card previews updated successfully!');
});

btnCancel.addEventListener('click', () => {
    farmerForm.reset();
    fileNameDisplay.textContent = 'No file chosen';
    uploadedPhotoSrc = null;
    isGenerated = false;

    landTableBody.innerHTML = '';
    addLandRow('Ahilyanagar', 'nagar', 'kedgaon', '12', '22', '0.042000');

    noPreviewPlaceholder.style.display = 'block';
    frontWrapper.style.display = 'none';
    backWrapper.style.display = 'none';
    downloadControls.style.display = 'none';
    btnGenerateCard.style.display = 'inline-flex';
    btnUpdateCard.style.display = 'none';
});

btnBackHome.addEventListener('click', () => {
    window.location.reload();
});

// --- Direct Download PDF/PNG Logic ---

// A4 PDF Download
btnDownloadA4.addEventListener('click', () => {
    const frontCanvas = document.getElementById('frontCanvas');
    const backCanvas = document.getElementById('backCanvas');
    const frontData = frontCanvas.toDataURL('image/jpeg', 0.85);
    const backData = backCanvas.toDataURL('image/jpeg', 0.85);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const cardW = 85.6;
    const cardH = 54;
    const pageW = 210;
    const pageH = 297;

    const x = (pageW - cardW) / 2;
    const yFront = (pageH / 2) - cardH - 10;
    const yBack = (pageH / 2) + 10;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(x - 0.5, yFront - 0.5, cardW + 1, cardH + 1);
    doc.addImage(frontData, 'JPEG', x, yFront, cardW, cardH);

    doc.rect(x - 0.5, yBack - 0.5, cardW + 1, cardH + 1);
    doc.addImage(backData, 'JPEG', x, yBack, cardW, cardH);

    doc.setLineDashPattern([2, 2], 0);
    doc.line(x - 15, pageH / 2, x + cardW + 15, pageH / 2);

    const id = farmerIdInput.value || '12345678901';
    const filename = `Farmer_Card_A4_${id}.pdf`;

    // Direct Data URL trigger to support local file:// protocol naming in Chrome
    const link = document.createElement('a');
    link.href = doc.output('datauristring');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 4x6 PDF Download
btnDownload4x6.addEventListener('click', () => {
    const frontCanvas = document.getElementById('frontCanvas');
    const backCanvas = document.getElementById('backCanvas');
    const frontData = frontCanvas.toDataURL('image/jpeg', 0.85);
    const backData = backCanvas.toDataURL('image/jpeg', 0.85);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [101.6, 152.4]
    });

    const cardW = 85.6;
    const cardH = 54;
    const pageW = 101.6;

    const x = (pageW - cardW) / 2;
    const yFront = 12;
    const yBack = 82;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(x - 0.5, yFront - 0.5, cardW + 1, cardH + 1);
    doc.addImage(frontData, 'JPEG', x, yFront, cardW, cardH);

    doc.rect(x - 0.5, yBack - 0.5, cardW + 1, cardH + 1);
    doc.addImage(backData, 'JPEG', x, yBack, cardW, cardH);

    const id = farmerIdInput.value || '12345678901';
    const filename = `Farmer_Card_4x6_${id}.pdf`;

    // Direct Data URL trigger to support local file:// protocol naming in Chrome
    const link = document.createElement('a');
    link.href = doc.output('datauristring');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// PNG Download
btnDownloadPng.addEventListener('click', () => {
    const frontCanvas = document.getElementById('frontCanvas');
    const backCanvas = document.getElementById('backCanvas');
    const id = farmerIdInput.value || '12345678901';

    const linkFront = document.createElement('a');
    linkFront.download = `Farmer_Card_Front_${id}.png`;
    linkFront.href = frontCanvas.toDataURL('image/png');
    linkFront.click();

    setTimeout(() => {
        const linkBack = document.createElement('a');
        linkBack.download = `Farmer_Card_Back_${id}.png`;
        linkBack.href = backCanvas.toDataURL('image/png');
        linkBack.click();
    }, 300);
});
