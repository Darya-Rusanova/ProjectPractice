// Функция для преобразования первой буквы первого слова в заглавную
function capitalizeFirstWord(text) {
    if (!text) return text;
    const trimmed = text.trimStart();
    if (!trimmed) return text;
    const words = trimmed.split(/\s+/);
    const firstWord = words[0];
    const capitalizedFirstWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    words[0] = capitalizedFirstWord;
    const newText = text.slice(0, text.indexOf(firstWord)) + words.join(' ');
    return newText;
}

// Функция для добавления точки в конце текста, если отсутствуют знаки ".", "!", "?", "..."
function ensureEndingWithPeriod(text) {
    if (!text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const endings = ['.', '!', '?', '...'];
    if (!endings.some(ending => trimmed.endsWith(ending))) {
        return trimmed + '.';
    }
    return text;
}

// Функция для отображения предварительного просмотра изображения
function showImagePreview(input, previewElement, removeButton) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 5 * 1024 * 1024; // 5 МБ
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            showNotification('Пожалуйста, загрузите изображение в формате JPEG или PNG', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
            return;
        }
        if (file.size > maxSize) {
            showNotification('Размер изображения не должен превышать 5 МБ', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.innerHTML = `<img src="${e.target.result}" style="max-width: 100px; border-radius: 4px; margin-top: 5px;" />`;
            if (removeButton) removeButton.style.display = 'block';
        };
        reader.onerror = () => {
            showNotification('Ошибка при загрузке изображения', 'error');
            input.value = '';
            previewElement.innerHTML = '';
            if (removeButton) removeButton.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.innerHTML = '';
        if (removeButton) removeButton.style.display = 'none';
    }
}

// Функция для очистки изображения
function clearImageInput(input, previewElement, removeButton) {
    input.value = '';
    previewElement.innerHTML = '';
    if (removeButton) removeButton.style.display = 'none';
    input.setAttribute('required', 'required');
    errorDiv.classList.remove('show');
}

// Функция ограничения ввода
function restrictInput(input, isDecimal = false) {
    input.addEventListener('input', (e) => {
        if (input.disabled) return;
        let value = input.value;
        console.log(`Ввод в поле: ${value}, key: ${e.data}`);
        if (isDecimal) {
            value = value.replace(/[^0-9,]/g, '');
            if (value.startsWith(',')) {
                value = '0' + value;
            }
            const parts = value.split(',');
            if (parts.length > 2) {
                value = parts[0] + ',' + parts[1];
            }
            if (parts[0].startsWith('0') && parts[0].length > 1 && !value.startsWith('0,')) {
                parts[0] = parts[0].replace(/^0+/, '') || '0';
                value = parts[0] + (parts[1] !== undefined ? ',' + parts[1] : '');
            }
            if (parts[1] && parts[1].length > 2) {
                parts[1] = parts[1].slice(0, 2);
                value = parts[0] + ',' + parts[1];
            }
        } else {
            value = value.replace(/[^0-9]/g, '').replace(/^0+/, '') || '0';
        }
        input.value = value;
    });

    input.addEventListener('keydown', (e) => {
        console.log(`Нажата клавиша: ${e.key}`);
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        if (isDecimal) {
            if ((e.key >= '0' && e.key <= '9') || e.key === ',' || allowedKeys.includes(e.key)) {
                if (e.key === ',' && input.value.includes(',')) {
                    e.preventDefault();
                }
                return;
            }
        } else {
            if ((e.key >= '0' && e.key <= '9') || allowedKeys.includes(e.key)) {
                return;
            }
        }
        e.preventDefault();
    });
}

// Функция проверки границ
function enforceMinMax(input, isDecimal = false) {
    input.addEventListener('change', () => {
        if (input.disabled) return;
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        let value = input.value;
        if (isDecimal) {
            if (value.endsWith(',')) {
                input.value = value.slice(0, -1);
                value = input.value;
            }
            value = parseFloat(value.replace(',', '.')) || 0;
        } else {
            value = parseInt(value) || 0;
        }
        if (isNaN(value)) {
            input.value = isDecimal ? min.toString().replace('.', ',') : min;
        } else if (value < min) {
            input.value = isDecimal ? min.toString().replace('.', ',') : min;
        } else if (value > max) {
            input.value = isDecimal ? max.toString().replace('.', ',') : max;
        }
    });
}

// Функция управления полем количества
function handleUnitChange(select, quantityInput) {
    if (select.value === 'пв') {
        quantityInput.value = '0';
        quantityInput.disabled = true;
    } else {
        quantityInput.disabled = false;
        if (quantityInput.value === '0') {
            quantityInput.value = '';
        }
    }
}

// Добавляем обработчики для заглавной буквы и точки
function initializeTextField(input, capitalize = false, addPeriod = false) {
    if (capitalize) {
        input.addEventListener('input', () => {
            const start = input.selectionStart;
            const end = input.selectionEnd;
            const originalValue = input.value;
            input.value = capitalizeFirstWord(input.value);
            if (input.value !== originalValue) {
                input.setSelectionRange(start, end);
            }
        });
    }
    if (addPeriod) {
        input.addEventListener('change', () => {
            input.value = ensureEndingWithPeriod(input.value);
        });
    }
}