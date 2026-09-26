def find_empty(board):
    """Находит пустую ячейку на поле (обозначается нулем)."""
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                return i, j  # Возвращает строку и столбец (row, col)
    return None


def is_valid(board, num, pos):
    """Проверяет, можно ли поставить число num в позицию pos (row, col)."""
    row, col = pos

    # 1. Проверяем строку
    for j in range(9):
        if board[row][j] == num and col != j:
            return False

    # 2. Проверяем столбец
    for i in range(9):
        if board[i][col] == num and row != i:
            return False

    # 3. Проверяем квадрат 3х3
    box_x = col // 3
    box_y = row // 3

    for i in range(box_y * 3, box_y * 3 + 3):
        for j in range(box_x * 3, box_x * 3 + 3):
            if board[i][j] == num and (i, j) != pos:
                return False

    return True


def solve_sudoku(board):
    """Основной алгоритм Backtracking для решения судоку."""
    find = find_empty(board)
    if not find:
        return True  # Если пустых ячеек нет — судоку решено!
    else:
        row, col = find

    # Пробуем подставлять цифры от 1 до 9
    for num in range(1, 10):
        if is_valid(board, num, (row, col)):
            board[row][col] = num

            # Рекурсивно пытаемся решить поле дальше с этим числом
            if solve_sudoku(board):
                return True

            # Если дальше решение зашло в тупик, сбрасываем ячейку (Backtrack)
            board[row][col] = 0

    return False