// Lấy các phần tử DOM cần thiết
const display = document.getElementById('display');
const keys = document.querySelector('.calculator-keys');

// Đối tượng lưu trữ trạng thái của máy tính
const calculator = {
    displayValue: '0',
    firstOperand: null,
    waitingForSecondOperand: false,
    operator: null,
};

// Hàm cập nhật màn hình hiển thị
function updateDisplay() {
    // Hiển thị giá trị hiện tại. Cắt bớt nếu quá dài.
    let displayString = String(calculator.displayValue);

    // Xử lý các giá trị đặc biệt (Infinity, -Infinity, NaN)
    if (displayString.includes('Infinity')) {
        display.textContent = 'Lỗi: Vô cực';
    } else if (displayString === 'NaN') {
        display.textContent = 'Lỗi: Không phải số';
    } else {
        display.textContent = displayString.length > 18
            ? parseFloat(displayString).toPrecision(15)
            : displayString;
    }
}

// Hàm xử lý nhập số
function inputDigit(digit) {
    const { displayValue, waitingForSecondOperand } = calculator;

    if (waitingForSecondOperand === true) {
        calculator.displayValue = digit;
        calculator.waitingForSecondOperand = false;
    } else {
        // Nếu displayValue là '0', thay thế bằng digit mới, ngược lại nối thêm
        calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
    }

    updateDisplay();
}

// Hàm xử lý dấu thập phân
function inputDecimal(dot) {
    // Không cho phép nhập dấu thập phân nếu đang chờ toán hạng thứ hai
    if (calculator.waitingForSecondOperand === true) {
        calculator.displayValue = '0.';
        calculator.waitingForSecondOperand = false;
        updateDisplay();
        return;
    }

    // Chỉ cho phép thêm dấu thập phân nếu chưa có
    if (!calculator.displayValue.includes(dot)) {
        calculator.displayValue += dot;
    }

    updateDisplay();
}

// Hàm xử lý toán tử
function handleOperator(nextOperator, isSpecial = false) {
    const { firstOperand, displayValue, operator, waitingForSecondOperand } = calculator;
    // Chuyển giá trị hiển thị thành số thực
    const inputValue = parseFloat(displayValue);

    // Nếu đang chờ số thứ 2 mà người dùng bấm đổi toán tử khác -> chỉ cập nhật operator
    if (operator && waitingForSecondOperand && !isSpecial) {
        calculator.operator = nextOperator;
        return;
    }
    // Kiểm tra Number.isFinite() như trong tài liệu
    if (!Number.isFinite(inputValue) && inputValue !== 0) {
        // Không làm gì nếu giá trị hiện tại là NaN, Infinity, -Infinity
        calculator.displayValue = 'Lỗi phép toán';
        updateDisplay();
        return;
    }
    if (isSpecial) {
        const result = performCalculation[nextOperator](inputValue);
        calculator.displayValue = String(result);
        calculator.firstOperand = result;
    }
    else if (firstOperand === null) {
        // Đây là toán hạng đầu tiên
        calculator.firstOperand = inputValue;
    }
    else if (operator) {
        // Có toán tử và đã có toán hạng thứ nhất -> Thực hiện tính toán
        const result = performCalculation[operator](firstOperand, inputValue);


        // Cập nhật kết quả, làm tròn nếu cần (để tránh lỗi số học dấu phẩy động)
        calculator.displayValue = String(result);
        calculator.firstOperand = result;
    }

    // Cập nhật trạng thái cho phép toán tiếp theo
    calculator.waitingForSecondOperand = true;
    calculator.operator = nextOperator;

    updateDisplay();
}

// Đối tượng chứa logic tính toán cho từng toán tử
const performCalculation = {
    divide: (firstOperand, secondOperand) => firstOperand / secondOperand,
    multiply: (firstOperand, secondOperand) => firstOperand * secondOperand,
    add: (firstOperand, secondOperand) => firstOperand + secondOperand,
    subtract: (firstOperand, secondOperand) => firstOperand - secondOperand,
    // Lũy thừa (Exponentiation): sử dụng toán tử **
    exponentiation: (firstOperand, secondOperand) => firstOperand ** secondOperand,
    // Phép chia dư (Modulo)
    modulo: (firstOperand, secondOperand) => firstOperand % secondOperand,
    sqrt: (firstOperand) => Math.sqrt(firstOperand),
    sine: (firstOperand) => Math.sin(firstOperand),
    cosine: (firstOperand) => Math.cos(firstOperand),
    tangent: (firstOperand) => Math.tan(firstOperand),
    cotangent: (firstOperand) => 1 / Math.tan(firstOperand)
};

// Hàm thiết lập lại máy tính
function resetCalculator() {
    calculator.displayValue = '0';
    calculator.firstOperand = null;
    calculator.waitingForSecondOperand = false;
    calculator.operator = null;
    updateDisplay();
}

// Hàm xóa 1 ký tự cuối cùng
function deleteLastDigit() {
    // Không xóa nếu vừa tính xong kết quả hoặc đang chờ nhập toán hạng thứ 2
    if (calculator.waitingForSecondOperand) {
        return;
    }

    const currentDisplay = String(calculator.displayValue);

    // Nếu màn hình đang báo lỗi (không phải số hợp lệ), reset về '0'
    if (currentDisplay.includes('Lỗi') || currentDisplay === 'NaN' || currentDisplay.includes('Infinity')) {
        calculator.displayValue = '0';
        updateDisplay();
        return;
    }

    // Xóa 1 ký tự ở cuối
    const slicedValue = currentDisplay.slice(0, -1);

    // Nếu xóa hết (chuỗi rỗng) hoặc chỉ còn dấu '-' thì đặt lại về '0'
    if (slicedValue === '' || slicedValue === '-') {
        calculator.displayValue = '0';
    } else {
        calculator.displayValue = slicedValue;
    }

    updateDisplay();
}

// Lắng nghe sự kiện click trên các nút
keys.addEventListener('click', (event) => {
    const { target } = event;
    const action = target.dataset.action;
    const value = target.dataset.value;

    // Đảm bảo chỉ xử lý các nút (button)
    if (!target.matches('button')) {
        return;
    }

    // Xử lý nút số
    if (value !== undefined) {
        inputDigit(value);
        return;
    }

    // Xử lý các hành động
    if (action === 'decimal') {
        inputDecimal('.');
        return;
    }

    if (action === 'clear') {
        resetCalculator();
        return;
    }

    // Nếu là phép toán hoặc dấu bằng
    if (action) {
        if (action === 'calculate') {
            // Xử lý phép tính cuối cùng (2 toán hạng)
            handleOperator(calculator.operator, false);
            calculator.waitingForSecondOperand = true;
            calculator.operator = null;
        } else if (target.classList.contains('key-special')) {
            // Truyền 'action' (vd: 'sqrt', 'sine') vào hàm
            handleOperator(action, true);
            calculator.waitingForSecondOperand = true;
            calculator.operator = null;
        } else {
            // Xử lý toán tử tiếp theo (+, -, *, /)
            handleOperator(action, false);
        }
        return;
    }
});

document.addEventListener("keydown", (event) => {
    if (Number.isFinite(Number(event.key.toString()))) {
        inputDigit(event.key.toString());
    }
    else if (event.key.toString() == '.') {
        inputDecimal('.');
    }
    else if (event.key === 'Backspace') {
        event.preventDefault(); // Tránh trình duyệt thực hiện hành động mặc định
        deleteLastDigit();
    }
    else if (['+', '-', '*', '/', '=', 'Enter'].includes(event.key.toString())) {
            event.preventDefault(); // Tránh kích hoạt lại nút đang focus trên giao diện
            switch (event.key.toString()) {
                case '+':
                    handleOperator('add', false);
                    break;
                case '-':
                    handleOperator('subtract', false);
                    break;
                case '*':
                    handleOperator('multiply', false);
                    break;
                case '/':
                    handleOperator('divide', false);
                    break;
                case '=':
                case 'Enter':
                    if (calculator.operator) {
                        handleOperator(calculator.operator, false);
                        calculator.waitingForSecondOperand = true;
                        calculator.operator = null;
                    }
                    break;
            }
        }   
});

// Khởi tạo hiển thị
updateDisplay();
