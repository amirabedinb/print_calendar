// تبدیل اعداد انگلیسی به فارسی
function toPersianNum(num) {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, function(w) {
        return persianNumbers[+w];
    });
}

// کلاس برای مدیریت تقویم شمسی
class PersianCalendar {
    constructor() {
        this.months = [
            'فروردین', 'اردیبهشت', 'خرداد', 
            'تیر', 'مرداد', 'شهریور', 
            'مهر', 'آبان', 'آذر', 
            'دی', 'بهمن', 'اسفند'
        ];
        
        this.weekdays = [
            'شنبه', 'یکشنبه', 'دوشنبه', 
            'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
        ];
    }
    
    // تبدیل تاریخ میلادی به شمسی
    toJalali(gregorianDate) {
        const date = new Date(gregorianDate);
        const gy = date.getFullYear();
        const gm = date.getMonth() + 1;
        const gd = date.getDate();
        
        const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        let gy2 = (gm > 2) ? (gy + 1) : gy;
        let days = 355666 + (365 * gy) + ~~((gy2 + 3) / 4) - ~~((gy2 + 99) / 100) + ~~((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
        let jy = -1595 + (33 * ~~(days / 12053));
        days %= 12053;
        jy += 4 * ~~(days / 1461);
        days %= 1461;
        
        if (days > 365) {
            jy += ~~((days - 1) / 365);
            days = (days - 1) % 365;
        }
        
        const jm = (days < 186) ? 1 + ~~(days / 31) : 7 + ~~((days - 186) / 30);
        const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
        
        return {
            year: jy,
            month: jm,
            day: jd,
            date: `${jy}/${jm < 10 ? '0' + jm : jm}/${jd < 10 ? '0' + jd : jd}`
        };
    }
    
    // تبدیل تاریخ شمسی به میلادی
    toGregorian(jy, jm, jd) {
        jy += 1595;
        let days = -355668 + (365 * jy) + (~~(jy / 33) * 8) + ~~(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
        let gy = 400 * ~~(days / 146097);
        days %= 146097;
        
        if (days > 36524) {
            gy += 100 * ~~(--days / 36524);
            days %= 36524;
            if (days >= 365) days++;
        }
        
        gy += 4 * ~~(days / 1461);
        days %= 1461;
        
        if (days > 365) {
            gy += ~~((days - 1) / 365);
            days = (days - 1) % 365;
        }
        
        let gd = days + 1;
        const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm;
        
        for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
            gd -= sal_a[gm];
        }
        
        return new Date(gy, gm - 1, gd);
    }
    
    // محاسبه روز هفته برای تاریخ شمسی (0 = شنبه)
    getDayOfWeek(jYear, jMonth, jDay) {
        const gDate = this.toGregorian(jYear, jMonth, jDay);
        let dayOfWeek = gDate.getDay(); // 0 = یکشنبه در تاریخ میلادی
        return (dayOfWeek + 1) % 7; // تبدیل به 0 = شنبه
    }
    
    // محاسبه تعداد روزهای ماه در تقویم شمسی
    getMonthLength(jYear, jMonth) {
        if (jMonth <= 6) return 31;
        if (jMonth <= 11) return 30;
        
        // اسفند
        if ((((jYear + 12) % 33) % 4) === 1) return 30; // کبیسه
        return 29;
    }
    
    // ایجاد اطلاعات ماه برای نمایش در تقویم
    getMonthInfo(jYear, jMonth) {
        const monthLength = this.getMonthLength(jYear, jMonth);
        const firstDayOfMonth = this.getDayOfWeek(jYear, jMonth, 1);
        
        return {
            year: jYear,
            month: jMonth,
            monthName: this.months[jMonth - 1],
            days: monthLength,
            firstDay: firstDayOfMonth
        };
    }
}

// کلاس اصلی برنامه
class CalendarApp {
    constructor() {
        this.calendar = new PersianCalendar();
        this.events = [];
        this.images = {};
        this.currentJalaliDate = this.getCurrentJalaliDate();
        this.currentMode = 1; // 1, 2, یا 3 ماه در هر صفحه
        this.currentOrientation = 'portrait'; // portrait یا landscape
        this.currentPaperSize = 'a4';
        
        this.initElements();
        this.bindEvents();
        this.setupMonthImages();
        this.generateCalendar();
    }
    
    getCurrentJalaliDate() {
        const today = new Date();
        return this.calendar.toJalali(today);
    }
    
    initElements() {
        // انتخاب المان های مورد نیاز
        this.modeSelect = document.getElementById('calendar-mode');
        this.orientationSelect = document.getElementById('page-orientation');
        this.paperSizeSelect = document.getElementById('paper-size');
        this.generateBtn = document.getElementById('generate-calendar');
        this.printBtn = document.getElementById('print-calendar');
        this.savePdfBtn = document.getElementById('save-pdf');
        this.previewContainer = document.getElementById('calendar-preview');
        this.imageContainer = document.getElementById('image-container');
        this.addEventBtn = document.getElementById('add-event');
        this.eventsContainer = document.getElementById('events-container');
        this.eventModal = document.getElementById('event-modal');
        this.closeModalBtn = document.querySelector('.close');
        this.saveEventBtn = document.getElementById('save-event');
        
        // ایجاد المان وضعیت PDF
        this.pdfStatus = document.createElement('div');
        this.pdfStatus.id = 'pdf-status';
        this.pdfStatus.innerText = 'در حال ایجاد PDF...';
        document.body.appendChild(this.pdfStatus);
    }
    
    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generateCalendar());
        this.printBtn.addEventListener('click', () => window.print());
        this.savePdfBtn.addEventListener('click', () => this.saveToPdf());
        this.modeSelect.addEventListener('change', () => {
            this.currentMode = parseInt(this.modeSelect.value);
            this.setupMonthImages();
        });
        this.orientationSelect.addEventListener('change', () => {
            this.currentOrientation = this.orientationSelect.value;
        });
        this.paperSizeSelect.addEventListener('change', () => {
            this.currentPaperSize = this.paperSizeSelect.value;
        });
        
        // مدیریت رویدادها
        this.addEventBtn.addEventListener('click', () => this.openEventModal());
        this.closeModalBtn.addEventListener('click', () => this.closeEventModal());
        this.saveEventBtn.addEventListener('click', () => this.saveEvent());
        
        // بستن مودال با کلیک بیرون از آن
        window.addEventListener('click', (e) => {
            if (e.target === this.eventModal) {
                this.closeEventModal();
            }
        });
    }
    
    setupMonthImages() {
        // پاک کردن محتوای قبلی
        this.imageContainer.innerHTML = '';
        
        // تعیین تعداد ماه‌ها بر اساس حالت نمایش
        const currentYear = this.currentJalaliDate.year;
        const numberOfMonths = 12;
        
        for (let i = 1; i <= numberOfMonths; i++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month-image-item';
            
            const monthName = this.calendar.months[i - 1];
            const monthLabel = document.createElement('p');
            monthLabel.textContent = monthName + ' ' + toPersianNum(currentYear);
            
            const imagePreview = document.createElement('div');
            imagePreview.className = 'image-preview';
            imagePreview.id = `image-preview-${i}`;
            
            const uploadLabel = document.createElement('label');
            uploadLabel.className = 'upload-btn';
            uploadLabel.textContent = 'انتخاب عکس';
            
            const uploadInput = document.createElement('input');
            uploadInput.type = 'file';
            uploadInput.accept = 'image/*';
            uploadInput.style.display = 'none';
            uploadInput.addEventListener('change', (e) => this.handleImageUpload(e, i));
            
            uploadLabel.appendChild(uploadInput);
            monthDiv.appendChild(monthLabel);
            monthDiv.appendChild(imagePreview);
            monthDiv.appendChild(uploadLabel);
            
            this.imageContainer.appendChild(monthDiv);
        }
    }
    
    handleImageUpload(event, monthIndex) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // ایجاد تصویر برای بررسی ابعاد
                const img = new Image();
                img.onload = () => {
                    // بررسی ابعاد تصویر (حداقل 1080x1080)
                    if (img.width >= 1080 && img.height >= 1080) {
                        const preview = document.getElementById(`image-preview-${monthIndex}`);
                        
                        // حذف تصویر قبلی اگر وجود داشته باشد
                        while (preview.firstChild) {
                            preview.removeChild(preview.firstChild);
                        }
                        
                        // نمایش تصویر جدید
                        const imageElement = document.createElement('img');
                        imageElement.src = e.target.result;
                        preview.appendChild(imageElement);
                        
                        // ذخیره تصویر برای استفاده در تقویم
                        this.images[monthIndex] = e.target.result;
                    } else {
                        alert('اندازه تصویر باید حداقل 1080x1080 پیکسل باشد.');
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    openEventModal() {
        this.eventModal.style.display = 'block';
    }
    
    closeEventModal() {
        this.eventModal.style.display = 'none';
    }
    
    saveEvent() {
        // دریافت اطلاعات از فرم
        const dateInput = document.getElementById('event-date').value;
        const title = document.getElementById('event-title').value;
        const type = document.getElementById('event-type').value;
        
        if (!dateInput || !title) {
            alert('لطفاً تاریخ و عنوان مناسبت را وارد کنید.');
            return;
        }
        
        // تبدیل تاریخ میلادی به شمسی
        const jalaliDate = this.calendar.toJalali(dateInput);
        
        // ایجاد رویداد جدید
        const newEvent = {
            id: Date.now(),
            date: jalaliDate,
            title,
            type
        };
        
        // افزودن به لیست رویدادها
        this.events.push(newEvent);
        
        // به‌روزرسانی نمایش رویدادها
        this.renderEvents();
        
        // بستن مودال
        this.closeEventModal();
        
        // به‌روزرسانی تقویم
        this.generateCalendar();
    }
    
    renderEvents() {
        this.eventsContainer.innerHTML = '';
        
        if (this.events.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'هیچ مناسبتی ثبت نشده است.';
            this.eventsContainer.appendChild(emptyMsg);
            return;
        }
        
        this.events.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            
            const eventInfo = document.createElement('div');
            eventInfo.
