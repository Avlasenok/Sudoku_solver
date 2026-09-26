import random
from solver import solve_sudoku, is_valid

def fill_diagonal_boxes(board):
    """Заполняет три диагональных квадрата 3х3 случайными цифрами."""
    for box in range(0, 9, 3):
        num_list = list(range(1, 10))
        random.shuffle(num_list)
        for i in range(3):
            for j in range(3):
                board[box + i][box + j] = num_list.pop()

def remove_numbers(board, count_to_remove):
    """Случайно удаляет цифры с поля, заменяя их на 0."""
    while count_to_remove > 0:
        row = random.randint(0, 8)
        col = random.randint(0, 8)
        
        # Если ячейка еще не пустая — очищаем её
        if board[row][col] != 0:
            board[row][col] = 0
            count_to_remove -= 1

def generate_sudoku_board(difficulty="medium"):
    """Основная функция генерации нового поля судоку."""
    # 1. Создаем пустую матрицу 9х9
    board = [[0 for _ in range(9)] for _ in range(9)]
    
    # 2. Заполняем диагонали
    fill_diagonal_boxes(board)
    
    # 3. Решаем поле целиком, чтобы получить валидную основу
    solve_sudoku(board)
    
    # 4. Определяем, сколько цифр стереть в зависимости от сложности
    # Для нормальной сложности оставим ~32 цифры (стереть 49)
    if difficulty == "easy":
        remove_count = 40
    elif difficulty == "hard":
        remove_count = 54
    else:  # medium
        remove_count = 49
        
    remove_numbers(board, remove_count)
    
    # 5. Разворачиваем в плоский массив из 81 элемента для фронтенда
    flat_board = [cell for row in board for cell in row]
    return flat_board