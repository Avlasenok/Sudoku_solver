document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('sudoku-board');
    const generateBtn = document.getElementById('generate-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const toggleLockBtn = document.getElementById('toggle-lock-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    const clearBtn = document.getElementById('clear-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    
    let isLockEnabled = true; // Глобальный флаг: включена ли защита подсказок

    // 1. Генерируем 81 ячейку
    for (let i = 0; i < 81; i++) {
        const input = document.createElement('input');
        input.type = 'number';
        input.classList.add('sudoku-cell');
        input.min = 1;
        input.max = 9;
        input.dataset.index = i;

        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length > 1) e.target.value = val.slice(-1);
            if (val === '0') e.target.value = '';
            validateBoard();
        });
        board.appendChild(input);
    }

    function getBoardState() {
        const cells = document.querySelectorAll('.sudoku-cell');
        return Array.from(cells).map(cell => cell.value ? parseInt(cell.value) : 0);
    }

    // Измененная функция заполнения: помечает стартовые цифры классом и атрибутом readonly
   function setBoardState(array, isNewGame = false) {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach((cell, index) => {
            // Если это совершенно новая игра или загрузка файла, 
            // сначала принудительно сбрасываем readonly и старые замки
            if (isNewGame) {
                cell.readOnly = false;
                cell.classList.remove('initial-lock');
            }

            cell.value = array[index] === 0 ? '' : array[index];
            
            if (isNewGame) {
                if (array[index] !== 0) {
                    cell.classList.add('initial-lock');
                    if (isLockEnabled) cell.readOnly = true;
                }
            }
        });
        validateBoard();
    }

    // 2. Управление блокировкой через кнопку
    toggleLockBtn.addEventListener('click', () => {
        const cells = document.querySelectorAll('.sudoku-cell');
        isLockEnabled = !isLockEnabled;

        if (isLockEnabled) {
            toggleLockBtn.innerText = '🔒 Подсказки заблокированы';
            toggleLockBtn.classList.remove('unlocked');
            toggleLockBtn.classList.add('locked');
            
            // Включаем readonly обратно для всех стартовых ячеек
            cells.forEach(cell => {
                if (cell.classList.contains('initial-lock')) {
                    cell.readOnly = true;
                }
            });
        } else {
            toggleLockBtn.innerText = '🔓 Защита отключена (Режим правки)';
            toggleLockBtn.classList.remove('locked');
            toggleLockBtn.classList.add('unlocked');
            
            // Разрешаем редактировать абсолютно любые ячейки
            cells.forEach(cell => cell.readOnly = false);
        }
    });

    // 3. Валидация поля
    function validateBoard() {
        const cells = document.querySelectorAll('.sudoku-cell');
        const boardState = getBoardState();
        
        cells.forEach(cell => cell.classList.remove('conflict'));
        let hasConflicts = false;

        for (let i = 0; i < 81; i++) {
            const num = boardState[i];
            if (num === 0) continue;

            const row = Math.floor(i / 9);
            const col = i % 9;
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;

            for (let j = 0; j < 81; j++) {
                if (i === j || boardState[j] !== num) continue;

                const r = Math.floor(j / 9);
                const c = j % 9;
                const br = Math.floor(r / 3) * 3;
                const bc = Math.floor(c / 3) * 3;

                if (row === r || col === c || (boxRow === br && boxCol === bc)) {
                    cells[i].classList.add('conflict');
                    cells[j].classList.add('conflict');
                    hasConflicts = true;
                }
            }
        }

        if (hasConflicts) {
            solveBtn.disabled = true;
            solveBtn.style.opacity = "0.5";
            checkBtn.disabled = true;
            checkBtn.style.opacity = "0.5";
        } else {
            solveBtn.disabled = false;
            solveBtn.style.opacity = "1";
            checkBtn.disabled = false;
            checkBtn.style.opacity = "1";
        }
        return hasConflicts;
    }

    // 4. Кнопка "Новая игра" (передаем true, чтобы зафиксировать маску подсказок)
    generateBtn.addEventListener('click', async () => {
        const difficulty = difficultySelect.value;
        generateBtn.innerText = 'Создаю...';
        generateBtn.disabled = true;

        try {
            const response = await fetch(`/api/generate?difficulty=${difficulty}`);
            const result = await response.json();
            
            if (result.success) {
                setBoardState(result.board, true);
            } else {
                alert('Не удалось сгенерировать поле');
            }
        } catch (error) {
            alert('Ошибка сервера при генерации.');
        } finally {
            generateBtn.innerText = 'Новая игра';
            generateBtn.disabled = false;
        }
    });

    // 5. Кнопка "Проверить себя"
    checkBtn.addEventListener('click', () => {
        const boardState = getBoardState();
        const hasEmptyCells = boardState.includes(0);
        
        if (hasEmptyCells) {
            alert('Поле заполнено не полностью! Дорешайте судоку до конца.');
            return;
        }

        const hasConflicts = validateBoard();
        if (!hasConflicts) {
            alert('🎉 Поздравляем! Вы абсолютно правильно решили это судоку!');
        } else {
            alert('❌ В решении есть ошибки (подсвечены красным). Попробуйте исправить их.');
        }
    });

    // 6. Кнопка "Решить по-умному" (Не сбрасывает маску исходных подсказок)
    solveBtn.addEventListener('click', async () => {
        const currentBoard = getBoardState();
        solveBtn.innerText = 'Думаю...';
        solveBtn.disabled = true;

        try {
            const response = await fetch('/api/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ board: currentBoard })
            });
            const result = await response.json();
            if (result.success) {
                // Нам не нужно перезаписывать статус начального лока при авто-решении
                setBoardState(result.board, false);
            } else {
                alert(result.error || 'Ошибка при решении');
            }
        } catch (error) {
            alert('Не удалось связаться с сервером.');
        } finally {
            solveBtn.innerText = 'Решить по-умному';
            validateBoard();
        }
    });

    // 7. Из файла (Считаем загруженное судоку за новую стартовую точку)
    uploadBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0]; // Берем самый первый выбранный файл
        if (!file) return; // Если файл почему-то не выбрался, выходим

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            
            // Чистим текст: убираем пробелы, переносы строк, заменяем точки и дефисы на нули
            const cleanText = text.replace(/[\r\n\s]/g, '').replace(/[\.\-]/g, '0');
            const chars = cleanText.split('');

            // Проверяем, набралось ли 81 число
            if (chars.length < 81) {
                alert('Ошибка: В файле должно быть как минимум 81 значащих символов (цифры, точки или дефисы). У вас в файле после очистки: ' + chars.length);
                return;
            }

            // Переводим символы в массив чисел
            const boardArray = chars.slice(0, 81).map(char => {
                const num = parseInt(char);
                return (isNaN(num) || num === 0) ? 0 : num;
            });

            // Загружаем на доску как новую игру (сбросит старые замки и поставит новые)
            setBoardState(boardArray, true);
            
            // Обязательно сбрасываем значение инпута, чтобы можно было загрузить этот же файл повторно
            fileInput.value = ''; 
        };
        reader.readAsText(file);
    });

   // Кнопка "Очистить" — убирает введенное, сохраняя подсказки, 
    // но если защита отключена или поле пустое, сбрасывает всё
    clearBtn.addEventListener('click', () => {
        const cells = document.querySelectorAll('.sudoku-cell');
        const boardState = getBoardState();
        
        // Если поле и так состоит только из стартовых подсказок, значит пользователь хочет стереть ВСЁ
        const onlyLocksLeft = boardState.every((num, idx) => num === 0 || cells[idx].classList.contains('initial-lock'));

        cells.forEach(cell => {
            if (!cell.classList.contains('initial-lock') || !isLockEnabled) {
                cell.value = '';
                cell.classList.remove('initial-lock');
                cell.readOnly = false;
            }
            cell.classList.remove('conflict');
        });
        validateBoard();
    });
});
