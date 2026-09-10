/* 
   Maha Smart Card Generator - Core Application Script
   Supports:
   1. Farmer ID Card Generator (Front/Back Canvas, QRious code, Land details table)
   2. Ration Card Generator (3 Templates: Yellow, Orange, Gray, Family members table, No QR)
   3. Marathi Transliteration (Real-time English-to-Marathi typing across all form fields)
   4. High-Resolution PDF (A4 & 4x6) and PNG Downloads
*/

// =========================================================================
// Global State & Elements
// =========================================================================
let currentTab = 'farmer'; // 'farmer' | 'ration'
let selectedRationTemplate = 'rashan_yellow'; // 'rashan_yellow' | 'rashan_orange' | 'rashan_gray'

let isFarmerGenerated = false;
let isRationGenerated = false;

let farmerPhotoSrc = null;
let rationPhotoSrc = null;
let activeCropTarget = 'farmer'; // 'farmer' | 'ration'

// Template Images
let imgFarmerFront = null;
let imgFarmerBack = null;
let imgRashanYellow = null;
let imgRashanOrange = null;
let imgRashanGray = null;

let landRowCount = 0;
let rationMemberRowCount = 0;

// Consent Modal Selectors
const consentModal = document.getElementById('consentModal');
const acceptCheckbox = document.getElementById('acceptCheckbox');
const btnAgree = document.getElementById('btnAgree');
const btnDisagree = document.getElementById('btnDisagree');

// Navigation Tabs
const tabFarmerBtn = document.getElementById('tabFarmerBtn');
const tabRationBtn = document.getElementById('tabRationBtn');
const farmerSection = document.getElementById('farmerSection');
const rationSection = document.getElementById('rationSection');

// Language & Transliteration Controls
const langSelector = document.getElementById('langSelector');
const btnToggleTranslit = document.getElementById('btnToggleTranslit');
const translitBadgeText = document.getElementById('translitBadgeText');
const btnBackHome = document.getElementById('btnBackHome');

// Image Cropper Modal Elements
let cropImageObj = null;
let cropZoom = 1.0;
let cropX = 0;
let cropY = 0;
let isDraggingCrop = false;
let dragStartX = 0;
let dragStartY = 0;

const cropModal = document.getElementById('cropModal');
const cropModalTitle = document.getElementById('cropModalTitle');
const cropCanvas = document.getElementById('cropCanvas');
const cropCtx = cropCanvas.getContext('2d');
const cropZoomRange = document.getElementById('cropZoomRange');
const btnCropZoomOut = document.getElementById('btnCropZoomOut');
const btnCropZoomIn = document.getElementById('btnCropZoomIn');
const btnCropCancel = document.getElementById('btnCropCancel');
const btnCropSave = document.getElementById('btnCropSave');
const cropContainer = document.getElementById('cropContainer');

// Farmer ID Elements
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
const villageInput = document.getElementById('addrVillage');
const tehsilInput = document.getElementById('addrTehsil');
const districtInput = document.getElementById('addrDistrict');
const pincodeInput = document.getElementById('addrPincode');
const btnAddLandRow = document.getElementById('btnAddLandRow');
const landTableBody = document.getElementById('landTableBody');
const btnGenerateCard = document.getElementById('btnGenerateCard');
const btnUpdateCard = document.getElementById('btnUpdateCard');
const btnCancel = document.getElementById('btnCancel');
const downloadControls = document.getElementById('downloadControls');
const noPreviewPlaceholder = document.getElementById('noPreviewPlaceholder');
const frontWrapper = document.getElementById('frontWrapper');
const backWrapper = document.getElementById('backWrapper');
const btnDownloadA4 = document.getElementById('btnDownloadA4');
const btnDownload4x6 = document.getElementById('btnDownload4x6');
const btnDownloadPng = document.getElementById('btnDownloadPng');

// Ration Card Elements
const rationForm = document.getElementById('rationForm');
const radioYellow = document.getElementById('radioYellow');
const radioOrange = document.getElementById('radioOrange');
const radioGray = document.getElementById('radioGray');
const pillYellow = document.getElementById('pillYellow');
const pillOrange = document.getElementById('pillOrange');
const pillGray = document.getElementById('pillGray');

const rationHeadName = document.getElementById('rationHeadName');
const rationCardNo = document.getElementById('rationCardNo');
const rationMobile = document.getElementById('rationMobile');
const rationFpsNo = document.getElementById('rationFpsNo');
const rationCardType = document.getElementById('rationCardType');
const rationUnits = document.getElementById('rationUnits');
const rationIncome = document.getElementById('rationIncome');
const rationIssueDate = document.getElementById('rationIssueDate');
const rationPhoto = document.getElementById('rationPhoto');
const rationPhotoWrapper = document.getElementById('rationPhotoWrapper');
const rationFileNameDisplay = document.getElementById('rationFileNameDisplay');
const rationSignature = document.getElementById('rationSignature');
const rationSignatureWrapper = document.getElementById('rationSignatureWrapper');
const rationSigFileNameDisplay = document.getElementById('rationSigFileNameDisplay');
let rationSignatureSrc = null;

const rationVillage = document.getElementById('rationVillage');
const rationTehsil = document.getElementById('rationTehsil');
const rationDistrict = document.getElementById('rationDistrict');
const rationPincode = document.getElementById('rationPincode');

const btnAddRationMember = document.getElementById('btnAddRationMember');
const rationMembersTableBody = document.getElementById('rationMembersTableBody');
const btnGenerateRationCard = document.getElementById('btnGenerateRationCard');
const btnUpdateRationCard = document.getElementById('btnUpdateRationCard');
const btnRationCancel = document.getElementById('btnRationCancel');

const rationDownloadControls = document.getElementById('rationDownloadControls');
const rationNoPreviewPlaceholder = document.getElementById('rationNoPreviewPlaceholder');
const rationFrontWrapper = document.getElementById('rationFrontWrapper');
const rationBackWrapper = document.getElementById('rationBackWrapper');
const rationPreviewBadge = document.getElementById('rationPreviewBadge');
const btnRationDownloadA4 = document.getElementById('btnRationDownloadA4');
const btnRationDownload4x6 = document.getElementById('btnRationDownload4x6');
const btnRationDownloadPng = document.getElementById('btnRationDownloadPng');


// =========================================================================
// Initialization
// =========================================================================
window.onload = async () => {
    // Show consent modal
    consentModal.classList.add('active');

    // Default Farmer Land Rows
    addLandRow('Ahilyanagar', 'nagar', 'kedgaon', '12', '22', '0.042000');

    // Default Ration Card Family Members
    initDefaultRationMembers();

    // Attach transliteration to inputs
    if (window.MarathiTransliterate) {
        window.MarathiTransliterate.init();
    }

    // Preload background templates
    try {
        await preloadAllTemplates();
        console.log('All 5 Card Templates Preloaded Successfully.');
    } catch (err) {
        console.error('Error preloading card templates:', err);
        alert('Warning: Some template images could not be loaded. Please ensure templates_base64.js is included.');
    }
};

function preloadAllTemplates() {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = 5;

        function onLoad() {
            loaded++;
            if (loaded === total) resolve();
        }

        imgFarmerFront = new Image();
        imgFarmerFront.onload = onLoad;
        imgFarmerFront.onerror = onLoad;
        imgFarmerFront.src = TEMPLATE_FRONT_B64;

        imgFarmerBack = new Image();
        imgFarmerBack.onload = onLoad;
        imgFarmerBack.onerror = onLoad;
        imgFarmerBack.src = TEMPLATE_BACK_B64;

        imgRashanYellow = new Image();
        imgRashanYellow.onload = onLoad;
        imgRashanYellow.onerror = onLoad;
        imgRashanYellow.src = TEMPLATE_RASHAN_YELLOW_B64;

        imgRashanOrange = new Image();
        imgRashanOrange.onload = onLoad;
        imgRashanOrange.onerror = onLoad;
        imgRashanOrange.src = TEMPLATE_RASHAN_ORANGE_B64;

        imgRashanGray = new Image();
        imgRashanGray.onload = onLoad;
        imgRashanGray.onerror = onLoad;
        imgRashanGray.src = TEMPLATE_RASHAN_GRAY_B64;
    });
}


// =========================================================================
// Consent Modal Event Listeners
// =========================================================================
acceptCheckbox.addEventListener('change', () => {
    btnAgree.disabled = !acceptCheckbox.checked;
});

btnAgree.addEventListener('click', () => {
    consentModal.classList.remove('active');
});

btnDisagree.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});


// =========================================================================
// Tab Switching
// =========================================================================
tabFarmerBtn.addEventListener('click', () => switchTab('farmer'));
tabRationBtn.addEventListener('click', () => switchTab('ration'));

function switchTab(tab) {
    currentTab = tab;
    if (tab === 'farmer') {
        tabFarmerBtn.classList.add('active');
        tabRationBtn.classList.remove('active');
        farmerSection.classList.add('active');
        rationSection.classList.remove('active');
    } else {
        tabRationBtn.classList.add('active');
        tabFarmerBtn.classList.remove('active');
        rationSection.classList.add('active');
        farmerSection.classList.remove('active');
    }
    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =========================================================================
// Transliteration & Language Toggle
// =========================================================================
btnToggleTranslit.addEventListener('click', () => {
    const isCurrentlyOn = window.MarathiTransliterate.isEnabled();
    const newState = !isCurrentlyOn;
    window.MarathiTransliterate.setEnabled(newState);

    if (newState) {
        btnToggleTranslit.classList.add('active');
        translitBadgeText.textContent = 'मराठी टायपिंग: चालू';
        if (langSelector) langSelector.value = 'mr';
    } else {
        btnToggleTranslit.classList.remove('active');
        translitBadgeText.textContent = 'English Typing: ON';
        if (langSelector) langSelector.value = 'en';
    }
});

langSelector.addEventListener('change', (e) => {
    const lang = e.target.value;
    if (lang === 'mr') {
        window.MarathiTransliterate.setEnabled(true);
        btnToggleTranslit.classList.add('active');
        translitBadgeText.textContent = 'मराठी टायपिंग: चालू';
    } else {
        window.MarathiTransliterate.setEnabled(false);
        btnToggleTranslit.classList.remove('active');
        translitBadgeText.textContent = 'English Typing: ON';
    }
});

btnBackHome.addEventListener('click', () => {
    if (confirm('सर्व माहिती रीसेट करायची आहे का? / Reset all fields and reload?')) {
        window.location.reload();
    }
});


// =========================================================================
// Photo Upload & Cropper Logic
// =========================================================================
farmerPhotoInput.addEventListener('change', (e) => handlePhotoUpload(e, 'farmer'));
rationPhoto.addEventListener('change', (e) => handlePhotoUpload(e, 'ration'));

function handlePhotoUpload(e, target) {
    const file = e.target.files[0];
    if (file) {
        activeCropTarget = target;
        if (target === 'farmer') {
            fileNameDisplay.textContent = file.name;
            cropModalTitle.textContent = 'शेतकरी फोटो अ‍ॅडजस्ट करा / Adjust Farmer Photo';
        } else {
            rationFileNameDisplay.textContent = file.name;
            cropModalTitle.textContent = 'कुटुंब प्रमुख फोटो अ‍ॅडजस्ट करा / Adjust Head Photo';
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                cropImageObj = img;
                cropZoom = 1.0;
                cropZoomRange.value = 1.0;

                cropX = 175 - (img.width * cropZoom) / 2;
                cropY = 175 - (img.height * cropZoom) / 2;

                cropModal.classList.add('active');
                drawCropPreview();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        if (target === 'farmer') {
            fileNameDisplay.textContent = 'No file chosen';
            farmerPhotoSrc = null;
        } else {
            rationFileNameDisplay.textContent = 'No photo chosen';
            rationPhotoSrc = null;
        }
    }
}

function drawCropPreview() {
    if (!cropImageObj) return;
    cropCtx.clearRect(0, 0, 350, 350);
    const w = cropImageObj.width * cropZoom;
    const h = cropImageObj.height * cropZoom;
    cropCtx.drawImage(cropImageObj, cropX, cropY, w, h);
}

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

// Touch controls for mobile
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

cropZoomRange.addEventListener('input', (e) => {
    const oldZoom = cropZoom;
    cropZoom = parseFloat(e.target.value);
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
    if (activeCropTarget === 'farmer') {
        farmerPhotoInput.value = '';
        fileNameDisplay.textContent = 'No file chosen';
        farmerPhotoSrc = null;
    } else {
        rationPhoto.value = '';
        rationFileNameDisplay.textContent = 'No photo chosen';
        rationPhotoSrc = null;
    }
    cropImageObj = null;
});

btnCropSave.addEventListener('click', () => {
    if (!cropImageObj) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 340;
    tempCanvas.height = 400;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(cropCanvas, 85, 68, 180, 214, 0, 0, 340, 400);

    if (activeCropTarget === 'farmer') {
        farmerPhotoSrc = tempCanvas.toDataURL('image/png');
        if (isFarmerGenerated) renderFarmerCardPreviews();
    } else {
        rationPhotoSrc = tempCanvas.toDataURL('image/png');
        if (isRationGenerated) renderRationCardPreviews();
    }

    cropModal.classList.remove('active');
});


// =========================================================================
// Canvas Drawing Helper Functions
// =========================================================================
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
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function getCurrentDateFormatted() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    const iw = img.width, ih = img.height;
    const r = Math.min(w / iw, h / ih);
    let nw = iw * r, nh = ih * r, cx, cy, cw, ch;
    if (nw < w) { const scale = w / nw; nw *= scale; nh *= scale; }
    if (nh < h) { const scale = h / nh; nw *= scale; nh *= scale; }
    cx = (iw - (w / (nw / iw))) * offsetX;
    cy = (ih - (h / (nh / ih))) * offsetY;
    cw = iw - cx * 2;
    ch = ih - cy * 2;
    if (cx < 0) { cx = 0; cw = iw; }
    if (cy < 0) { cy = 0; ch = ih; }
    ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

function drawPhotoPlaceholder(ctx, x, y, w, h) {
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 3.2, w / 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.95, w / 2.2, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHOTO', x + w / 2, y + h * 0.72);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        let word = words[n];
        // Handle excessively long tokens (e.g. continuous text without spaces)
        while (ctx.measureText(word).width > maxWidth) {
            let sliceIdx = 1;
            while (sliceIdx <= word.length && ctx.measureText(word.slice(0, sliceIdx)).width <= maxWidth) {
                sliceIdx++;
            }
            sliceIdx = Math.max(1, sliceIdx - 1);
            const chunk = word.slice(0, sliceIdx);
            if (line.trim().length > 0) {
                ctx.fillText(line.trim(), x, currentY);
                currentY += lineHeight;
                line = '';
            }
            ctx.fillText(chunk, x, currentY);
            currentY += lineHeight;
            word = word.slice(sliceIdx);
        }

        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0 && line.trim().length > 0) {
            ctx.fillText(line.trim(), x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    if (line.trim().length > 0) {
        ctx.fillText(line.trim(), x, currentY);
    }
    return currentY;
}

function getQRCodeImage(text) {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            const utf8EncodedText = unescape(encodeURIComponent(text));
            new QRious({
                element: canvas,
                value: utf8EncodedText,
                size: 300,
                level: 'M'
            });
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


// =========================================================================
// Form Validation Helpers
// =========================================================================
function setValidationState(inputEl, isValid, message = '') {
    if (!inputEl) return;
    inputEl.classList.remove('is-valid', 'is-invalid');
    inputEl.classList.add(isValid ? 'is-valid' : 'is-invalid');

    if (inputEl.classList.contains('form-control') && inputEl.closest('td')) return;

    const parent = inputEl.closest('.form-group');
    if (!parent) return;

    const existingError = parent.querySelector('.error-msg');
    if (existingError) existingError.remove();

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

function setPhotoBoxValidationState(wrapperEl, isValid, message = '') {
    if (!wrapperEl) return;
    wrapperEl.classList.remove('is-valid', 'is-invalid');
    wrapperEl.classList.add(isValid ? 'is-valid' : 'is-invalid');

    const parent = wrapperEl.closest('.form-group');
    if (!parent) return;

    const existingError = parent.querySelector('.error-msg');
    if (existingError) existingError.remove();

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


// =========================================================================
// 1. Farmer ID Card Logic
// =========================================================================

// Input Formattings
aadhaarInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
    }
    e.target.value = formatted;
});

mobileInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
});

farmerIdInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 11);
});

pincodeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
});

dobInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 8);
    let formatted = '';
    if (val.length > 0) formatted += val.substring(0, 2);
    if (val.length > 2) formatted += '/' + val.substring(2, 4);
    if (val.length > 4) formatted += '/' + val.substring(4, 8);
    e.target.value = formatted;
});

function addLandRow(state = '', subDist = '', vill = '', sNo = '', ss = '', area = '') {
    const currentRows = landTableBody.querySelectorAll('tr').length;
    if (currentRows >= 5) {
        alert("Maximum 5 land records allowed.");
        return;
    }

    landRowCount++;
    const tr = document.createElement('tr');
    tr.id = `land-row-${landRowCount}`;
    tr.innerHTML = `
        <td><input type="text" class="form-control state-input transliterate-mr" value="${state}" placeholder="Ahilyanagar" required></td>
        <td><input type="text" class="form-control subdist-input transliterate-mr" value="${subDist}" placeholder="nagar" required></td>
        <td><input type="text" class="form-control vill-input transliterate-mr" value="${vill}" placeholder="kedgaon" required></td>
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

    // Attach transliteration to dynamic inputs
    if (window.MarathiTransliterate) {
        tr.querySelectorAll('.transliterate-mr').forEach(el => window.MarathiTransliterate.attach(el));
    }

    lucide.createIcons();
    updateAddLandRowButtonState();
}

function deleteLandRow(rowId) {
    const row = document.getElementById(`land-row-${rowId}`);
    if (row) {
        row.remove();
        updateAddLandRowButtonState();
    }
}

function updateAddLandRowButtonState() {
    const currentRows = landTableBody.querySelectorAll('tr').length;
    btnAddLandRow.disabled = currentRows >= 5;
    btnAddLandRow.style.opacity = currentRows >= 5 ? '0.5' : '1';
}

btnAddLandRow.addEventListener('click', () => addLandRow());

function validateFarmerDetails() {
    let isValid = true;
    let firstInvalidInput = null;

    function checkField(inputEl, condition, errorMsg) {
        if (!condition) {
            setValidationState(inputEl, false, errorMsg);
            isValid = false;
            if (!firstInvalidInput) firstInvalidInput = inputEl;
        } else {
            setValidationState(inputEl, true);
        }
    }

    checkField(nameEngInput, nameEngInput.value.trim() !== '', "Name in English is required.");
    checkField(nameLocalInput, nameLocalInput.value.trim() !== '', "Name in local language is required.");

    const dobVal = dobInput.value;
    checkField(dobInput, dobVal.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(dobVal), "DOB must be in DD/MM/YYYY format.");
    checkField(mobileInput, mobileInput.value.length === 10, "Mobile must be exactly 10 digits.");
    checkField(farmerIdInput, farmerIdInput.value.length === 11, "Farmer ID must be exactly 11 digits.");

    const rawAadhaar = aadhaarInput.value.replace(/\s/g, '');
    checkField(aadhaarInput, rawAadhaar.length === 12, "Aadhaar must be exactly 12 digits.");

    if (!farmerPhotoSrc) {
        setPhotoBoxValidationState(document.querySelector('.file-upload-wrapper'), false, "Farmer photo is compulsory.");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = farmerPhotoInput;
    } else {
        setPhotoBoxValidationState(document.querySelector('.file-upload-wrapper'), true);
    }

    checkField(villageInput, villageInput.value.trim() !== '', "Village is required.");
    checkField(tehsilInput, tehsilInput.value.trim() !== '', "Tehsil is required.");
    checkField(districtInput, districtInput.value.trim() !== '', "District is required.");
    checkField(pincodeInput, pincodeInput.value.length === 6, "Pincode must be 6 digits.");

    if (!isValid && firstInvalidInput) {
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstInvalidInput !== farmerPhotoInput) firstInvalidInput.focus();
    }

    return isValid;
}

async function renderFarmerCardPreviews() {
    if (!imgFarmerFront || !imgFarmerBack) return;

    const frontCanvas = document.getElementById('frontCanvas');
    const backCanvas = document.getElementById('backCanvas');
    const fCtx = frontCanvas.getContext('2d');
    const bCtx = backCanvas.getContext('2d');

    fCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
    bCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    fCtx.drawImage(imgFarmerFront, 0, 0);
    bCtx.drawImage(imgFarmerBack, 0, 0);

    // Front Photo
    if (farmerPhotoSrc) {
        const userImg = new Image();
        userImg.src = farmerPhotoSrc;
        await new Promise(r => { userImg.onload = r; userImg.onerror = r; });
        drawImageProp(fCtx, userImg, 75, 240, 330, 390);
        fCtx.strokeStyle = '#000000';
        fCtx.lineWidth = 4;
        fCtx.strokeRect(75, 240, 330, 390);
    } else {
        drawPhotoPlaceholder(fCtx, 75, 240, 330, 390);
    }

    fCtx.textAlign = 'left';
    fCtx.textBaseline = 'alphabetic';

    // Name English
    fCtx.fillStyle = '#000000';
    fCtx.font = 'bold 46px "Inter", sans-serif';
    fCtx.fillText(nameEngInput.value || 'Farmer Name', 440, 250);

    // Name Local
    fCtx.fillStyle = '#15803d';
    fCtx.font = 'bold 40px "Inter", sans-serif';
    fCtx.fillText(nameLocalInput.value || 'शेतकऱ्याचे नाव', 440, 305);

    // Details Block
    const labelX = 440;
    const valOffset = 860;
    fCtx.font = 'bold 34px "Inter", sans-serif';

    fCtx.fillStyle = '#475569';
    fCtx.fillText('जन्म दिनांक / DOB :', labelX, 385);
    fCtx.fillStyle = '#000000';
    fCtx.fillText(dobInput.value || '01/01/1970', valOffset, 385);

    fCtx.fillStyle = '#475569';
    fCtx.fillText('लिंग / Gender :', labelX, 445);
    fCtx.fillStyle = '#000000';
    fCtx.fillText(genderInput.value || 'Male', valOffset, 445);

    fCtx.fillStyle = '#475569';
    fCtx.fillText('मोबाईल / Mobile :', labelX, 505);
    fCtx.fillStyle = '#000000';
    fCtx.fillText(mobileInput.value || '1234567890', valOffset, 505);

    fCtx.fillStyle = '#475569';
    fCtx.fillText('आधार नं / Aadhaar No :', labelX, 565);
    fCtx.fillStyle = '#000000';
    fCtx.fillText(aadhaarInput.value || '1234 5432 5678', valOffset, 565);

    const combinedAddress = `${villageInput.value || 'Village'}, ${tehsilInput.value || 'Tehsil'}, ${districtInput.value || 'District'} - ${pincodeInput.value || '123456'}`;

    // Build Land Records text for QR
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

    // QR Code
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

    // Farmer ID Capsule
    fCtx.fillStyle = '#ffffff';
    fCtx.strokeStyle = '#e2e8f0';
    fCtx.lineWidth = 4;
    drawRoundRect(fCtx, 430, 680, 700, 100, 50, true, true);

    fCtx.textAlign = 'center';
    fCtx.fillStyle = '#000000';
    fCtx.font = 'bold 38px "Outfit", sans-serif';
    fCtx.fillText(`Farmer Id: ${farmerIdInput.value || '12345678901'}`, 430 + 700 / 2, 680 + 63);

    // --- Back Canvas ---
    bCtx.textAlign = 'left';
    bCtx.textBaseline = 'alphabetic';

    bCtx.fillStyle = '#166534';
    bCtx.font = 'bold 36px "Inter", sans-serif';
    bCtx.fillText('संपूर्ण पत्ता / Address', 80, 205);

    bCtx.fillStyle = '#000000';
    bCtx.font = '500 32px "Inter", sans-serif';
    wrapText(bCtx, combinedAddress, 80, 255, 1389, 45);

    const startTableY = 390;
    const colWidths = [231, 231, 231, 232, 232, 232];
    const colHeaders = ['जिल्हा / District', 'तालुका / Sub Dist.', 'गाव / Village', 'गट नं. / Gat No.', 'खाते नं. / Survey No.', 'क्षेत्र / Area'];

    bCtx.fillStyle = '#166534';
    bCtx.font = 'bold 36px "Inter", sans-serif';
    bCtx.fillText('जमिनीची माहिती / Land Details', 80, startTableY - 20);

    bCtx.fillStyle = '#f1f5f9';
    bCtx.fillRect(80, startTableY, 1389, 80);
    bCtx.strokeStyle = '#cbd5e1';
    bCtx.lineWidth = 2;
    bCtx.strokeRect(80, startTableY, 1389, 80);

    let curX = 80;
    bCtx.fillStyle = '#374151';
    bCtx.font = 'bold 20px "Inter", sans-serif';
    bCtx.textAlign = 'center';

    for (let i = 0; i < colHeaders.length; i++) {
        bCtx.fillText(colHeaders[i], curX + colWidths[i] / 2, startTableY + 50);
        if (i < colHeaders.length - 1) {
            bCtx.beginPath();
            bCtx.moveTo(curX + colWidths[i], startTableY);
            bCtx.lineTo(curX + colWidths[i], startTableY + 80);
            bCtx.stroke();
        }
        curX += colWidths[i];
    }

    let curY = startTableY + 80;
    tbodyRows.forEach((row, index) => {
        const state = row.querySelector('.state-input').value || '-';
        const subdist = row.querySelector('.subdist-input').value || '-';
        const vill = row.querySelector('.vill-input').value || '-';
        const gata = row.querySelector('.gata-input').value || '-';
        const survey = row.querySelector('.survey-input').value || '-';
        const area = row.querySelector('.area-input').value || '-';
        const rowData = [state, subdist, vill, gata, survey, area];
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        bCtx.fillStyle = bgColor;
        bCtx.fillRect(80, curY, 1389, 70);
        bCtx.strokeStyle = '#cbd5e1';
        bCtx.strokeRect(80, curY, 1389, 70);

        let rowX = 80;
        bCtx.fillStyle = '#1f2937';
        bCtx.font = '26px "Inter", sans-serif';
        bCtx.textAlign = 'center';

        for (let i = 0; i < rowData.length; i++) {
            bCtx.fillText(rowData[i], rowX + colWidths[i] / 2, curY + 43);
            if (i < rowData.length - 1) {
                bCtx.beginPath();
                bCtx.moveTo(rowX + colWidths[i], curY);
                bCtx.lineTo(rowX + colWidths[i], curY + 70);
                bCtx.stroke();
            }
            rowX += colWidths[i];
        }
        curY += 70;
    });
}

btnGenerateCard.addEventListener('click', async () => {
    if (!validateFarmerDetails()) return;

    isFarmerGenerated = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    noPreviewPlaceholder.style.display = 'none';
    frontWrapper.style.display = 'block';
    backWrapper.style.display = 'block';
    downloadControls.style.display = 'flex';

    btnGenerateCard.style.display = 'none';
    btnUpdateCard.style.display = 'inline-flex';

    await renderFarmerCardPreviews();
});

btnUpdateCard.addEventListener('click', async () => {
    if (!validateFarmerDetails()) return;
    await renderFarmerCardPreviews();
    alert('Farmer Card previews updated successfully!');
});

btnCancel.addEventListener('click', () => {
    farmerForm.reset();
    fileNameDisplay.textContent = 'No file chosen';
    farmerPhotoSrc = null;
    isFarmerGenerated = false;

    landTableBody.innerHTML = '';
    addLandRow('Ahilyanagar', 'nagar', 'kedgaon', '12', '22', '0.042000');

    noPreviewPlaceholder.style.display = 'block';
    frontWrapper.style.display = 'none';
    backWrapper.style.display = 'none';
    downloadControls.style.display = 'none';
    btnGenerateCard.style.display = 'inline-flex';
    btnUpdateCard.style.display = 'none';
});


// =========================================================================
// 2. Ration Card Logic
// =========================================================================

// Template Selection Listeners
radioYellow.addEventListener('change', () => selectRationTemplate('rashan_yellow'));
radioOrange.addEventListener('change', () => selectRationTemplate('rashan_orange'));
radioGray.addEventListener('change', () => selectRationTemplate('rashan_gray'));

function selectRationTemplate(templateName) {
    selectedRationTemplate = templateName;

    pillYellow.classList.toggle('active', templateName === 'rashan_yellow');
    pillOrange.classList.toggle('active', templateName === 'rashan_orange');
    pillGray.classList.toggle('active', templateName === 'rashan_gray');

    if (templateName === 'rashan_yellow') {
        rationPreviewBadge.textContent = '🟡 YELLOW TEMPLATE (BPL / AAY)';
        rationPreviewBadge.style.background = 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 45%, #fde68a 100%)';
        rationPreviewBadge.style.color = '#92400e';
        rationPreviewBadge.style.border = '1.5px solid #f59e0b';
        rationPreviewBadge.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.22)';
    } else if (templateName === 'rashan_orange') {
        rationPreviewBadge.textContent = '🟠 ORANGE TEMPLATE (APL / PHH)';
        rationPreviewBadge.style.background = 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%)';
        rationPreviewBadge.style.color = '#9a3412';
        rationPreviewBadge.style.border = '1.5px solid #ea580c';
        rationPreviewBadge.style.boxShadow = '0 2px 8px rgba(234, 88, 12, 0.22)';
    } else {
        rationPreviewBadge.textContent = '⚪ GRAY / WHITE TEMPLATE (NPHH)';
        rationPreviewBadge.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 45%, #e2e8f0 100%)';
        rationPreviewBadge.style.color = '#334155';
        rationPreviewBadge.style.border = '1.5px solid #94a3b8';
        rationPreviewBadge.style.boxShadow = '0 2px 8px rgba(100, 116, 139, 0.2)';
    }

    if (isRationGenerated) {
        renderRationCardPreviews();
    }
}

// Formatting Inputs for Ration Card
rationCardNo.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 12);
    let formatted = '';
    for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
    }
    e.target.value = formatted;
});

rationMobile.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
});

rationPincode.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
});

// Format Family Income: only digits allowed in input box (max 9 digits), easy deletion on backspace
rationIncome.addEventListener('input', (e) => {
    let digits = e.target.value.replace(/\D/g, '').substring(0, 9);
    e.target.value = digits;
});

// Format Units: max 99
rationUnits.addEventListener('input', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) {
        e.target.value = 1;
    } else if (val > 99) {
        e.target.value = 99;
    }
});

// Signature Upload Handler (keeps signature image as-is without background removal)
rationSignature.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        rationSigFileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            rationSignatureSrc = event.target.result;
            if (isRationGenerated) {
                renderRationCardPreviews();
            }
        };
        reader.readAsDataURL(file);
    } else {
        rationSigFileNameDisplay.textContent = 'No signature file chosen';
        rationSignatureSrc = null;
        if (isRationGenerated) {
            renderRationCardPreviews();
        }
    }
});

// Dynamic Family Member Rows (Back Side) - Max 7 Members Allowed
const MAX_RATION_MEMBERS = 7;

function initDefaultRationMembers() {
    rationMembersTableBody.innerHTML = '';
    rationIssueDate.value = getCurrentDateFormatted();
    addRationMemberRow('रमेश किसन पाटील', '38/M', 'SELF', 'XXXX-XXXX-6612');
    addRationMemberRow('सुनिता रमेश पाटील', '34/F', 'WIFE', 'XXXX-XXXX-6774');
    addRationMemberRow('राहुल रमेश पाटील', '14/M', 'SON', 'XXXX-XXXX-8365');
    addRationMemberRow('प्रिया रमेश पाटील', '11/F', 'DAUGHTER', 'XXXX-XXXX-8366');
}

function updateRationUnitsCount() {
    const rowCount = rationMembersTableBody.querySelectorAll('tr').length;
    rationUnits.value = Math.min(99, rowCount);
    if (rowCount >= MAX_RATION_MEMBERS) {
        btnAddRationMember.disabled = true;
        btnAddRationMember.style.opacity = '0.5';
        btnAddRationMember.style.cursor = 'not-allowed';
    } else {
        btnAddRationMember.disabled = false;
        btnAddRationMember.style.opacity = '1';
        btnAddRationMember.style.cursor = 'pointer';
    }
}

function addRationMemberRow(name = '', ageGender = '', relation = '', aadhaar = '') {
    const currentCount = rationMembersTableBody.querySelectorAll('tr').length;
    if (currentCount >= MAX_RATION_MEMBERS) {
        alert('जास्तीत जास्त 7 सदस्य जोडता येतील! / Maximum 7 family members allowed.');
        return;
    }

    rationMemberRowCount++;
    const tr = document.createElement('tr');
    tr.id = `ration-member-row-${rationMemberRowCount}`;

    // Note: member-age-input and member-aadhaar-input DO NOT have transliterate-mr (English/Numeric only)
    tr.innerHTML = `
        <td class="member-sr-no" style="font-weight: 700; color: #475569;">${currentCount + 1}</td>
        <td>
            <input type="text" class="form-control member-name-input transliterate-mr" value="${name}" placeholder="उदा. रमेश पाटील" required>
        </td>
        <td>
            <input type="text" class="form-control member-age-input" value="${ageGender}" placeholder="35/M" maxlength="8" required>
        </td>
        <td>
            <input type="text" class="form-control member-relation-input transliterate-mr" value="${relation}" placeholder="उदा. SELF / WIFE / SON" required>
        </td>
        <td>
            <input type="text" class="form-control member-aadhaar-input" value="${aadhaar}" placeholder="XXXX-XXXX-1234" maxlength="14" required>
        </td>
        <td style="text-align: center;">
            <button type="button" class="btn-delete-row" onclick="deleteRationMemberRow(${rationMemberRowCount})">
                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
            </button>
        </td>
    `;

    rationMembersTableBody.appendChild(tr);

    // Format Aadhaar on input inside row (Auto adds '-' after 4 and 8 digits)
    const aadhaarInp = tr.querySelector('.member-aadhaar-input');
    aadhaarInp.addEventListener('input', (e) => {
        let raw = aadhaarInp.value.replace(/[^0-9X]/gi, '').toUpperCase().substring(0, 12);
        let formatted = '';
        if (raw.length > 8) {
            formatted = raw.substring(0, 4) + '-' + raw.substring(4, 8) + '-' + raw.substring(8);
        } else if (raw.length > 4) {
            formatted = raw.substring(0, 4) + '-' + raw.substring(4);
            if (raw.length === 8 && e.inputType !== 'deleteContentBackward') {
                formatted += '-';
            }
        } else if (raw.length === 4 && e.inputType !== 'deleteContentBackward') {
            formatted = raw + '-';
        } else {
            formatted = raw;
        }
        aadhaarInp.value = formatted;
    });

    // Auto-format Age/Gender (1-3 digits for age, max 3 digits, auto '/' and max 1 letter for gender e.g. 35/M, 102/F)
    const ageInp = tr.querySelector('.member-age-input');
    ageInp.addEventListener('input', (e) => {
        let raw = ageInp.value;
        let clean = raw.replace(/[^0-9\/a-zA-Z]/g, '');
        let hasSlash = clean.includes('/');

        let parts = clean.split('/');
        if (parts.length > 1) {
            let agePart = parts[0].replace(/\D/g, '').substring(0, 3);
            let genderPart = parts.slice(1).join('').replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase();
            if (genderPart.length > 0) {
                ageInp.value = agePart + '/' + genderPart;
            } else if (clean.endsWith('/') || hasSlash) {
                ageInp.value = agePart + '/';
            } else {
                ageInp.value = agePart;
            }
        } else {
            let digits = clean.replace(/\D/g, '').substring(0, 3);
            let letters = clean.replace(/[^a-zA-Z]/g, '').substring(0, 1).toUpperCase();
            if (letters.length > 0 && digits.length > 0) {
                ageInp.value = digits + '/' + letters;
            } else if (letters.length > 0) {
                ageInp.value = '/' + letters;
            } else {
                ageInp.value = digits;
            }
        }
    });

    // Attach transliteration ONLY to member-name-input and member-relation-input
    if (window.MarathiTransliterate) {
        tr.querySelectorAll('.transliterate-mr').forEach(el => window.MarathiTransliterate.attach(el));
    }

    lucide.createIcons();
    reindexRationMemberRows();
    updateRationUnitsCount();
}

function deleteRationMemberRow(rowId) {
    const row = document.getElementById(`ration-member-row-${rowId}`);
    if (row) {
        row.remove();
        reindexRationMemberRows();
        updateRationUnitsCount();
    }
}

function reindexRationMemberRows() {
    const rows = rationMembersTableBody.querySelectorAll('tr');
    rows.forEach((row, idx) => {
        const srCell = row.querySelector('.member-sr-no');
        if (srCell) srCell.textContent = idx + 1;
    });
}

btnAddRationMember.addEventListener('click', () => {
    addRationMemberRow('', '', '', '');
});

// Ration Card Validation
function validateRationDetails() {
    let isValid = true;
    let firstInvalidInput = null;

    function checkField(inputEl, condition, errorMsg) {
        if (!condition) {
            setValidationState(inputEl, false, errorMsg);
            isValid = false;
            if (!firstInvalidInput) firstInvalidInput = inputEl;
        } else {
            setValidationState(inputEl, true);
        }
    }

    checkField(rationHeadName, rationHeadName.value.trim() !== '', "कुटुंब प्रमुखाचे नाव आवश्यक आहे / Head name required.");

    const rawCardNo = rationCardNo.value.replace(/\s/g, '');
    checkField(rationCardNo, rawCardNo.length >= 10, "रेशन कार्ड नंबर आवश्यक आहे / Ration card number required.");

    checkField(rationMobile, rationMobile.value.length === 10, "मोबाईल क्रमांक 10 अंकी असावा / Mobile must be 10 digits.");
    checkField(rationFpsNo, rationFpsNo.value.trim() !== '', "रास्त भाव दुकान क्र. आवश्यक आहे / FPS number required.");

    const rawIncomeDigits = rationIncome.value.replace(/\D/g, '');
    checkField(rationIncome, rawIncomeDigits.length > 0 && rawIncomeDigits.length <= 9, "वार्षिक उत्पन्न 10 अंकांपेक्षा कमी असावे / Income must be less than 10 digits.");

    const unitsVal = parseInt(rationUnits.value, 10);
    checkField(rationUnits, !isNaN(unitsVal) && unitsVal >= 1 && unitsVal <= 99, "युनिट्स 1 ते 99 दरम्यान असावे / Units must be 1 to 99.");

    const issueVal = rationIssueDate.value.trim();
    checkField(rationIssueDate, issueVal.length === 10 && /^\d{2}\/\d{2}\/\d{4}$/.test(issueVal), "वाटप दिनांक DD/MM/YYYY असावा / Valid issue date required.");

    if (!rationPhotoSrc) {
        setPhotoBoxValidationState(rationPhotoWrapper, false, "कुटुंब प्रमुखाचा फोटो आवश्यक आहे / Photo is required.");
        isValid = false;
        if (!firstInvalidInput) firstInvalidInput = rationPhoto;
    } else {
        setPhotoBoxValidationState(rationPhotoWrapper, true);
    }

    checkField(rationVillage, rationVillage.value.trim() !== '', "गाव आवश्यक आहे / Village required.");
    checkField(rationTehsil, rationTehsil.value.trim() !== '', "तालुका आवश्यक आहे / Tehsil required.");
    checkField(rationDistrict, rationDistrict.value.trim() !== '', "जिल्हा आवश्यक आहे / District required.");
    checkField(rationPincode, rationPincode.value.length === 6, "पिनकोड 6 अंकी असावा / Pincode must be 6 digits.");

    const memberRows = rationMembersTableBody.querySelectorAll('tr');
    if (memberRows.length === 0) {
        alert("किमान एका कुटुंब सदस्याची नोंद असणे आवश्यक आहे / At least 1 member required.");
        isValid = false;
    } else if (memberRows.length > MAX_RATION_MEMBERS) {
        alert("जास्तीत जास्त 7 सदस्य जोडता येतील / Maximum 7 family members allowed.");
        isValid = false;
    } else {
        memberRows.forEach(row => {
            const name = row.querySelector('.member-name-input');
            const ageGender = row.querySelector('.member-age-input');
            const relation = row.querySelector('.member-relation-input');
            const aadhaar = row.querySelector('.member-aadhaar-input');

            checkField(name, name.value.trim() !== '', "नाव आवश्यक");
            checkField(ageGender, ageGender.value.trim() !== '', "वय/लिंग आवश्यक");
            checkField(relation, relation.value.trim() !== '', "नाते आवश्यक");
            checkField(aadhaar, aadhaar.value.trim() !== '', "आधार क्रमांक आवश्यक");
        });
    }

    if (!isValid && firstInvalidInput) {
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstInvalidInput !== rationPhoto) firstInvalidInput.focus();
    }

    return isValid;
}

// Advanced Adaptive Signature Background Removal (Isolates pure dark ink strokes)
function processSignatureImage(imgSrc) {
    return new Promise((resolve) => {
        if (!imgSrc) return resolve(null);
        const img = new Image();
        img.onload = () => {
            try {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = img.width;
                offCanvas.height = img.height;
                const offCtx = offCanvas.getContext('2d');
                offCtx.drawImage(img, 0, 0);

                const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const data = imgData.data;

                // Thresholding to remove white/gray/shadow paper background and keep ink strokes crisp
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a === 0) continue;

                    // Calculate perceived lightness
                    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                    if (lum > 175) {
                        // Light paper / background -> 100% transparent
                        data[i + 3] = 0;
                    } else {
                        // Dark ink stroke -> Deep dark navy/black with smooth opacity
                        const darkness = Math.max(0, (175 - lum) / 175);
                        data[i] = 15;     // Deep slate black
                        data[i + 1] = 23;
                        data[i + 2] = 42;
                        data[i + 3] = Math.min(255, Math.round(darkness * 255 * 2.2));
                    }
                }

                offCtx.putImageData(imgData, 0, 0);
                const cleanedImg = new Image();
                cleanedImg.onload = () => resolve(cleanedImg);
                cleanedImg.onerror = () => resolve(img);
                cleanedImg.src = offCanvas.toDataURL('image/png');
            } catch (err) {
                console.error("Signature processing error:", err);
                resolve(img);
            }
        };
        img.onerror = () => resolve(null);
        img.src = imgSrc;
    });
}

// Render Ration Card Canvases (Front & Back - 1536 x 1024)
async function renderRationCardPreviews() {
    let activeTemplateImg = imgRashanYellow;

    if (selectedRationTemplate === 'rashan_orange') {
        activeTemplateImg = imgRashanOrange;
    } else if (selectedRationTemplate === 'rashan_gray') {
        activeTemplateImg = imgRashanGray;
    }

    if (!activeTemplateImg) return;

    const frontCanvas = document.getElementById('rationFrontCanvas');
    const backCanvas = document.getElementById('rationBackCanvas');
    const fCtx = frontCanvas.getContext('2d');
    const bCtx = backCanvas.getContext('2d');

    // Clear Canvases
    fCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
    bCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    // Draw Background Templates
    fCtx.drawImage(activeTemplateImg, 0, 0, 1536, 1024);
    bCtx.drawImage(activeTemplateImg, 0, 0, 1536, 1024);

    // -------------------------------------------------------------------------
    // FRONT SIDE RENDERING (FPS in Middle, Dark Keys + Normal Values)
    // -------------------------------------------------------------------------

    // 1. Left Column: Head Photo (x: 95, y: 260, w: 320, h: 385)
    const photoX = 95;
    const photoY = 260;
    const photoW = 320;
    const photoH = 385;

    if (rationPhotoSrc) {
        const headImg = new Image();
        headImg.src = rationPhotoSrc;
        await new Promise(r => { headImg.onload = r; headImg.onerror = r; });
        drawImageProp(fCtx, headImg, photoX, photoY, photoW, photoH);
        fCtx.strokeStyle = '#000000';
        fCtx.lineWidth = 3;
        fCtx.strokeRect(photoX, photoY, photoW, photoH);
    } else {
        drawPhotoPlaceholder(fCtx, photoX, photoY, photoW, photoH);
    }

    // 2. Issue Date directly below Photo
    const photoCenterX = photoX + photoW / 2;
    fCtx.textAlign = 'center';
    fCtx.textBaseline = 'alphabetic';
    fCtx.fillStyle = '#000000';
    fCtx.font = 'bold 26px "Inter", sans-serif';
    fCtx.fillText('Issue Date', photoCenterX, 690);

    fCtx.fillStyle = '#1e293b';
    fCtx.font = '600 30px "Inter", sans-serif';
    fCtx.fillText(rationIssueDate.value || getCurrentDateFormatted(), photoCenterX, 730);

    // 3. Top Middle: Fare Price Shop No (FPS number distinctly bigger and prominent)
    const fpsKey = 'Fare Price Shop No: ';
    const fpsVal = rationFpsNo.value || '1234567890124';

    fCtx.font = 'bold 35px "Inter", sans-serif';
    const fpsKeyWidth = fCtx.measureText(fpsKey).width;
    fCtx.font = 'bold 42px "Outfit", "Inter", sans-serif';
    const fpsValWidth = fCtx.measureText(fpsVal).width;
    const fpsTotalWidth = fpsKeyWidth + fpsValWidth;
    const fpsStartX = 768 - fpsTotalWidth / 2; // Centered on card width (1536 / 2)
    const fpsY = 252;

    fCtx.textAlign = 'left';
    fCtx.font = 'bold 35px "Inter", sans-serif';
    fCtx.fillStyle = '#000000';
    fCtx.fillText(fpsKey, fpsStartX, fpsY);

    fCtx.font = 'bold 42px "Outfit", "Inter", sans-serif';
    fCtx.fillStyle = '#0f172a';
    fCtx.fillText(fpsVal, fpsStartX + fpsKeyWidth, fpsY);

    // 4. Details Information List on Right side (Dynamic spacing avoiding overlap with multi-line addresses)
    const contentStartX = 450;
    let curY = 305;
    const rowStep = 55;

    // Helper to draw Dark Bold Key + Value
    function drawRowField(keyText, valText, yPos, keyFontSize = 34, valFontSize = 34) {
        fCtx.textAlign = 'left';
        fCtx.font = `bold ${keyFontSize}px "Inter", sans-serif`;
        fCtx.fillStyle = '#000000'; // Dark Bold Key
        fCtx.fillText(keyText, contentStartX, yPos);
        const kw = fCtx.measureText(keyText).width;

        fCtx.font = `600 ${valFontSize}px "Inter", sans-serif`;
        fCtx.fillStyle = '#1e293b'; // Value
        fCtx.fillText(valText, contentStartX + kw + 8, yPos);
    }

    // Row 1: Scheme Name
    drawRowField('Scheme Name: ', rationCardType.value || 'पिवळे (BPL/अंत्योदय)', curY, 34, 34);

    // Row 2: Head of Family
    curY += rowStep;
    drawRowField('Head of Family: ', rationHeadName.value || 'कुटुंब प्रमुखाचे नाव', curY, 34, 35);

    // Row 3: Address (Dark Key + Wrapped Value)
    curY += rowStep;
    const fullAddress = `${rationVillage.value || 'गाव/वार्ड'}, ता. ${rationTehsil.value || 'तालुका'}, जि. ${rationDistrict.value || 'जिल्हा'} - ${rationPincode.value || '414001'}`;

    fCtx.textAlign = 'left';
    fCtx.font = 'bold 34px "Inter", sans-serif';
    fCtx.fillStyle = '#000000';
    fCtx.fillText('Address: ', contentStartX, curY);
    const addrPrefixWidth = fCtx.measureText('Address: ').width;

    fCtx.font = '500 32px "Inter", sans-serif';
    fCtx.fillStyle = '#1e293b';
    const addrMaxW = 1460 - (contentStartX + addrPrefixWidth + 8);
    const afterAddrY = wrapText(fCtx, fullAddress, contentStartX + addrPrefixWidth + 8, curY, addrMaxW, 38);
    curY = Math.max(curY + rowStep, afterAddrY + 44);

    // Row 4: Mobile Number
    drawRowField('Mobile Number: ', rationMobile.value || '1234567890', curY, 34, 34);

    // Row 5: Units & Income (Dark Keys + Formatted Values)
    curY += rowStep;
    fCtx.textAlign = 'left';
    fCtx.font = 'bold 34px "Inter", sans-serif';
    fCtx.fillStyle = '#000000';
    fCtx.fillText('No. of Units: ', contentStartX, curY);
    let curOff = contentStartX + fCtx.measureText('No. of Units: ').width;

    fCtx.font = '600 34px "Inter", sans-serif';
    fCtx.fillStyle = '#1e293b';
    const unitsStr = (rationUnits.value || '4') + '   |   ';
    fCtx.fillText(unitsStr, curOff, curY);
    curOff += fCtx.measureText(unitsStr).width;

    fCtx.font = 'bold 34px "Inter", sans-serif';
    fCtx.fillStyle = '#000000';
    fCtx.fillText('Total Income: ', curOff, curY);
    curOff += fCtx.measureText('Total Income: ').width;

    // Automatic format for Annual Income with ₹ and /- in code
    const rawIncome = rationIncome.value ? rationIncome.value.replace(/\D/g, '') : '';
    let formattedIncome = '₹ 45,000/-';
    if (rawIncome.length > 0) {
        const num = parseInt(rawIncome, 10);
        formattedIncome = '₹ ' + num.toLocaleString('en-IN') + '/-';
    }
    fCtx.font = '600 34px "Inter", sans-serif';
    fCtx.fillStyle = '#1e293b';
    fCtx.fillText(formattedIncome, curOff, curY);

    // 5. Bottom Center/Left: "Ration Card Number" inside White Horizontal Capsule (Shifted lower)
    const cardNoVal = rationCardNo.value || '1234567890124';
    const pillX = 450;
    const pillY = 720;
    const pillW = 610;
    const pillH = 110;
    const pillRadius = 55;

    // Draw White Horizontal Capsule Box
    fCtx.save();
    fCtx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    fCtx.shadowBlur = 10;
    fCtx.shadowOffsetY = 4;
    fCtx.fillStyle = '#ffffff';
    fCtx.strokeStyle = '#94a3b8';
    fCtx.lineWidth = 2.5;
    drawRoundRect(fCtx, pillX, pillY, pillW, pillH, pillRadius, true, true);
    fCtx.restore();

    // Capsule Content
    const pillCenterX = pillX + pillW / 2;
    fCtx.textAlign = 'center';
    fCtx.fillStyle = '#475569';
    fCtx.font = 'bold 20px "Inter", sans-serif';
    fCtx.fillText('RATION CARD NUMBER', pillCenterX, pillY + 36);

    fCtx.fillStyle = '#1e3a8a';
    fCtx.font = 'bold 48px "Outfit", monospace';
    fCtx.fillText(cardNoVal, pillCenterX, pillY + 86);

    // 6. Bottom Right: Signature Line & Transparent Signature Image (Shifted lower)
    const sigLineStartX = 1110;
    const sigLineEndX = 1460;
    const sigLineY = 795;
    const sigCenterX = (sigLineStartX + sigLineEndX) / 2;

    if (rationSignatureSrc) {
        const sigImg = new Image();
        sigImg.src = rationSignatureSrc;
        await new Promise(r => { sigImg.onload = r; sigImg.onerror = r; });
        drawImageProp(fCtx, sigImg, sigLineStartX, 680, 350, 110);
    }

    // Signature Line
    fCtx.beginPath();
    fCtx.strokeStyle = '#0f172a';
    fCtx.lineWidth = 2.5;
    fCtx.moveTo(sigLineStartX, sigLineY);
    fCtx.lineTo(sigLineEndX, sigLineY);
    fCtx.stroke();

    // Signature Label below line
    fCtx.textAlign = 'center';
    fCtx.fillStyle = '#0f172a';
    fCtx.font = 'bold 26px "Inter", sans-serif';
    fCtx.fillText('Signature', sigCenterX, sigLineY + 34);


    // -------------------------------------------------------------------------
    // BACK SIDE RENDERING (Max 7 Rows, 2x Bigger Table, Full Footer Visible)
    // -------------------------------------------------------------------------

    // 1. Table Setup & Header (matching reference: Sr | Member Name | Age/Gender | Relation | Aadhar No.)
    const tableTopY = 230;
    const tableW = 1376;
    const colW = [90, 486, 210, 250, 340]; // Total = 1376px
    const headers = ['Sr', 'Member Name', 'Age/Gender', 'Relation', 'Aadhar No.'];

    // Header Background Bar
    const headerH = 75;
    bCtx.fillStyle = '#1e293b';
    bCtx.fillRect(80, tableTopY, tableW, headerH);
    bCtx.strokeStyle = '#0f172a';
    bCtx.lineWidth = 2;
    bCtx.strokeRect(80, tableTopY, tableW, headerH);

    // Header Titles (Bold 30px)
    let hX = 80;
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 30px "Inter", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'alphabetic';

    for (let i = 0; i < headers.length; i++) {
        bCtx.fillText(headers[i], hX + colW[i] / 2, tableTopY + 48);
        if (i < headers.length - 1) {
            bCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            bCtx.beginPath();
            bCtx.moveTo(hX + colW[i], tableTopY);
            bCtx.lineTo(hX + colW[i], tableTopY + headerH);
            bCtx.stroke();
        }
        hX += colW[i];
    }

    // Populate Member Rows (Max 7 rows, 75px height and 28px font)
    const memberRows = Array.from(rationMembersTableBody.querySelectorAll('tr')).slice(0, MAX_RATION_MEMBERS);
    let rowY = tableTopY + headerH;
    const rowH = 75;

    memberRows.forEach((tr, idx) => {
        const sr = idx + 1;
        const name = tr.querySelector('.member-name-input').value || '-';
        const ageGender = tr.querySelector('.member-age-input').value || '-';
        const relation = tr.querySelector('.member-relation-input').value || '-';
        const aadhaar = tr.querySelector('.member-aadhaar-input').value || '-';

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        bCtx.fillStyle = rowBg;
        bCtx.fillRect(80, rowY, tableW, rowH);

        bCtx.strokeStyle = '#cbd5e1';
        bCtx.lineWidth = 1.5;
        bCtx.strokeRect(80, rowY, tableW, rowH);

        const rowData = [sr, name, ageGender, relation, aadhaar];
        let cellX = 80;

        for (let c = 0; c < rowData.length; c++) {
            bCtx.fillStyle = '#1e293b';
            bCtx.font = c === 1 ? 'bold 29px "Inter", sans-serif' : 'bold 27px "Inter", sans-serif';

            if (c === 1) {
                // Member Name left aligned with padding
                bCtx.textAlign = 'left';
                bCtx.fillText(rowData[c], cellX + 24, rowY + 47);
            } else {
                bCtx.textAlign = 'center';
                bCtx.fillText(rowData[c], cellX + colW[c] / 2, rowY + 47);
            }

            if (c < rowData.length - 1) {
                bCtx.strokeStyle = '#e2e8f0';
                bCtx.beginPath();
                bCtx.moveTo(cellX + colW[c], rowY);
                bCtx.lineTo(cellX + colW[c], rowY + rowH);
                bCtx.stroke();
            }
            cellX += colW[c];
        }

        rowY += rowH;
    });
}

btnGenerateRationCard.addEventListener('click', async () => {
    if (!validateRationDetails()) return;

    isRationGenerated = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    rationNoPreviewPlaceholder.style.display = 'none';
    rationFrontWrapper.style.display = 'block';
    rationBackWrapper.style.display = 'block';
    rationDownloadControls.style.display = 'flex';

    btnGenerateRationCard.style.display = 'none';
    btnUpdateRationCard.style.display = 'inline-flex';

    await renderRationCardPreviews();
});

btnUpdateRationCard.addEventListener('click', async () => {
    if (!validateRationDetails()) return;
    await renderRationCardPreviews();
    alert('रेशन कार्ड प्रिव्ह्यू यशस्वीरित्या अपडेट झाले! / Ration card updated successfully!');
});

btnRationCancel.addEventListener('click', () => {
    rationForm.reset();
    rationFileNameDisplay.textContent = 'No photo chosen';
    rationSigFileNameDisplay.textContent = 'No signature file chosen';
    rationPhotoSrc = null;
    rationSignatureSrc = null;
    isRationGenerated = false;

    initDefaultRationMembers();
    selectRationTemplate('rashan_yellow');

    rationNoPreviewPlaceholder.style.display = 'block';
    rationFrontWrapper.style.display = 'none';
    rationBackWrapper.style.display = 'none';
    rationDownloadControls.style.display = 'none';

    btnGenerateRationCard.style.display = 'inline-flex';
    btnUpdateRationCard.style.display = 'none';
});


// =========================================================================
// PDF & PNG Download Logic (Farmer ID & Ration Card)
// =========================================================================

// --- Farmer ID Exports ---
btnDownloadA4.addEventListener('click', () => {
    downloadCardPDF_A4('frontCanvas', 'backCanvas', `Farmer_Card_A4_${farmerIdInput.value || '12345678901'}.pdf`);
});

btnDownload4x6.addEventListener('click', () => {
    downloadCardPDF_4x6('frontCanvas', 'backCanvas', `Farmer_Card_4x6_${farmerIdInput.value || '12345678901'}.pdf`);
});

btnDownloadPng.addEventListener('click', () => {
    downloadCardPNGs('frontCanvas', 'backCanvas', `Farmer_Card_${farmerIdInput.value || '12345678901'}`);
});

// --- Ration Card Exports ---
btnRationDownloadA4.addEventListener('click', () => {
    const cardId = rationCardNo.value.replace(/\s/g, '') || '272001234567';
    downloadCardPDF_A4('rationFrontCanvas', 'rationBackCanvas', `Ration_Card_A4_${cardId}.pdf`);
});

btnRationDownload4x6.addEventListener('click', () => {
    const cardId = rationCardNo.value.replace(/\s/g, '') || '272001234567';
    downloadCardPDF_4x6('rationFrontCanvas', 'rationBackCanvas', `Ration_Card_4x6_${cardId}.pdf`);
});

btnRationDownloadPng.addEventListener('click', () => {
    const cardId = rationCardNo.value.replace(/\s/g, '') || '272001234567';
    downloadCardPNGs('rationFrontCanvas', 'rationBackCanvas', `Ration_Card_${cardId}`);
});

// Generic A4 PDF Exporter
function downloadCardPDF_A4(frontCanvasId, backCanvasId, filename) {
    const frontCanvas = document.getElementById(frontCanvasId);
    const backCanvas = document.getElementById(backCanvasId);
    const frontData = frontCanvas.toDataURL('image/jpeg', 0.9);
    const backData = backCanvas.toDataURL('image/jpeg', 0.9);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const cardW = 85.6; // Standard CR80 width in mm
    const cardH = 54.0; // Standard CR80 height in mm
    const pageW = 210;
    const pageH = 297;

    const x = (pageW - cardW) / 2;
    const yFront = (pageH / 2) - cardH - 10;
    const yBack = (pageH / 2) + 10;

    // Outer borders
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.rect(x - 0.5, yFront - 0.5, cardW + 1, cardH + 1);
    doc.addImage(frontData, 'JPEG', x, yFront, cardW, cardH);

    doc.rect(x - 0.5, yBack - 0.5, cardW + 1, cardH + 1);
    doc.addImage(backData, 'JPEG', x, yBack, cardW, cardH);

    // Fold line
    doc.setLineDashPattern([2, 2], 0);
    doc.line(x - 15, pageH / 2, x + cardW + 15, pageH / 2);

    // Trigger download
    const link = document.createElement('a');
    link.href = doc.output('datauristring');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generic 4x6 PDF Exporter
function downloadCardPDF_4x6(frontCanvasId, backCanvasId, filename) {
    const frontCanvas = document.getElementById(frontCanvasId);
    const backCanvas = document.getElementById(backCanvasId);
    const frontData = frontCanvas.toDataURL('image/jpeg', 0.9);
    const backData = backCanvas.toDataURL('image/jpeg', 0.9);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [101.6, 152.4]
    });

    const cardW = 85.6;
    const cardH = 54.0;
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

    const link = document.createElement('a');
    link.href = doc.output('datauristring');
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generic PNG Exporter
function downloadCardPNGs(frontCanvasId, backCanvasId, baseName) {
    const frontCanvas = document.getElementById(frontCanvasId);
    const backCanvas = document.getElementById(backCanvasId);

    const linkFront = document.createElement('a');
    linkFront.download = `${baseName}_Front.png`;
    linkFront.href = frontCanvas.toDataURL('image/png');
    linkFront.click();

    setTimeout(() => {
        const linkBack = document.createElement('a');
        linkBack.download = `${baseName}_Back.png`;
        linkBack.href = backCanvas.toDataURL('image/png');
        linkBack.click();
    }, 300);
}
