from flask import Flask, render_template, request, jsonify
import os
# Импортируем функцию решения из нашего solver.py
from solver import solve_sudoku
from generator import generate_sudoku_board

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
template_dir = os.path.join(BASE_DIR, '..', 'frontend', 'templates')
static_dir = os.path.join(BASE_DIR, '..', 'frontend', 'static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/solve', methods=['POST'])
def solve():
    data = request.get_json()
    if not data or 'board' not in data:
        return jsonify({'error': 'Нет данных поля'}), 400
    
    flat_board = data['board'] # Получаем плоский массив из 81 элемента
    
    # 1. Превращаем плоский массив в матрицу 9х9 для solver.py
    matrix = []
    for i in range(0, 81, 9):
        # Заменяем пустые строки на 0
        row = [int(x) if (x and str(x).isdigit()) else 0 for x in flat_board[i:i+9]]
        matrix.append(row)
        
    # 2. Запускаем наш алгоритм Backtracking
    success = solve_sudoku(matrix)
    
    if success:
        # 3. Разворачиваем матрицу обратно в плоский массив для фронтенда
        solved_flat = [cell for row in matrix for cell in row]
        return jsonify({'success': True, 'board': solved_flat})
    else:
        return jsonify({'success': False, 'error': 'Это судоку не имеет решений!'})

@app.route('/api/generate', methods=['GET'])
def generate():
    # Получаем выбранную сложность из URL (по умолчанию "medium")
    difficulty = request.args.get('difficulty', 'medium')
    
    # Передаем её в наш генератор
    new_board = generate_sudoku_board(difficulty=difficulty)
    return jsonify({'success': True, 'board': new_board})

if __name__ == '__main__':
    print("🚀 Сервер Судоку успешно перезапущен...")
    app.run(debug=False, host='0.0.0.0', port=5000)