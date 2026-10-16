
const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const buttons = document.querySelector(".buttons");

// Stores the current arithmetic expression.
let expression = "";

// Tracks whether the last action produced a result.
let justCalculated = false;

// Updates the expression and result areas on the screen.
function updateDisplay(value = expression || "0") {
    expressionDisplay.textContent = expression;
    resultDisplay.textContent = value;
}

// Checks whether a character is an arithmetic operator.
function isOperator(character) {
    return ["+", "-", "*", "/"].includes(character);
}

// Adds a number, decimal point, or operator to the expression.
function appendValue(value) {
    // Start a new calculation after pressing a number.
    if (justCalculated && !isOperator(value)) {
        expression = "";
    }

    justCalculated = false;

    const lastCharacter = expression.slice(-1);

    // Prevent two decimal points in the same number.
    if (value === ".") {
        const currentNumber = expression.split(/[+\-*/]/).pop();

        if (currentNumber.includes(".")) {
            return;
        }

        // Automatically change .5 to 0.5.
        if (currentNumber === "" || currentNumber === "-") {
            expression += "0";
        }
    }

    // Replace the previous operator if another operator is pressed.
    // A minus sign after another operator is allowed for negative numbers.
    if (isOperator(value) && isOperator(lastCharacter)) {
        if (value === "-" && lastCharacter !== "-") {
            expression += value;
        } else if (
            value !== "-" ||
            expression.length === 1 ||
            !isOperator(expression.at(-2))
        ) {
            expression = expression.slice(0, -1) + value;
            updateDisplay();
            return;
        } else {
            return;
        }
    }

    expression += value;
    updateDisplay();
}

// Removes the last character from the expression.
function deleteLast() {
    expression = expression.slice(0, -1);
    justCalculated = false;
    updateDisplay();
}

// Clears the entire calculation.
function clearCalculator() {
    expression = "";
    justCalculated = false;
    expressionDisplay.textContent = "";
    resultDisplay.textContent = "0";
}

// Evaluates an arithmetic expression without using eval().
function calculate(expressionToCalculate) {
    // Convert the expression into numbers and operators.
    const tokens = expressionToCalculate.match(
        /(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/]/g
    );

    // Reject empty expressions or invalid characters.
    if (
        !tokens ||
        tokens.join("") !== expressionToCalculate.replace(/\s/g, "")
    ) {
        throw new Error("Invalid expression");
    }

    let position = 0;

    // Reads numbers, including negative numbers and decimals.
    function parseNumber() {
        const token = tokens[position];

        if (token === "+") {
            position++;
            return parseNumber();
        }

        if (token === "-") {
            position++;
            return -parseNumber();
        }

        if (!token || isOperator(token)) {
            throw new Error("Invalid number");
        }

        position++;

        const number = Number(token);

        if (!Number.isFinite(number)) {
            throw new Error("Invalid number");
        }

        return number;
    }

    // Handles multiplication and division before addition/subtraction.
    function parseTerm() {
        let value = parseNumber();

        while (
            tokens[position] === "*" ||
            tokens[position] === "/"
        ) {
            const operator = tokens[position++];
            const nextNumber = parseNumber();

            if (operator === "/" && nextNumber === 0) {
                throw new Error("Cannot divide by zero");
            }

            value = operator === "*"
                ? value * nextNumber
                : value / nextNumber;

            if (!Number.isFinite(value)) {
                throw new Error("Result out of range");
            }
        }

        return value;
    }

    // Handles addition and subtraction after terms are evaluated.
    function parseExpression() {
        let value = parseTerm();

        while (
            tokens[position] === "+" ||
            tokens[position] === "-"
        ) {
            const operator = tokens[position++];
            const nextNumber = parseTerm();

            value = operator === "+"
                ? value + nextNumber
                : value - nextNumber;

            if (!Number.isFinite(value)) {
                throw new Error("Result out of range");
            }
        }

        return value;
    }

    // Evaluate the full expression and reject leftover tokens.
    const answer = parseExpression();

    if (position !== tokens.length) {
        throw new Error("Invalid expression");
    }

    return answer;
}

// Calculates the answer and displays friendly error messages.
function showResult() {
    if (!expression) {
        return;
    }

    try {
        const answer = calculate(expression);

        // Limit floating-point display errors.
        const formattedAnswer = Number(answer.toPrecision(12));

        expressionDisplay.textContent = expression + " =";
        resultDisplay.textContent = String(formattedAnswer);

        // Save the answer so it can be used in the next calculation.
        expression = String(formattedAnswer);
        justCalculated = true;
    } catch (error) {
        // Display a helpful message instead of crashing.
        resultDisplay.textContent =
            error.message === "Cannot divide by zero"
                ? "Cannot divide by zero"
                : error.message === "Result out of range"
                    ? "Result too large"
                    : "Invalid input";

        expression = "";
        justCalculated = false;
    }
}

// Responds to calculator button clicks.
buttons.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    // Ignore clicks that are not on calculator buttons.
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const value = button.dataset.value;

    if (action === "clear") {
        clearCalculator();
    } else if (action === "delete") {
        deleteLast();
    } else if (action === "calculate") {
        showResult();
    } else if (value !== undefined) {
        appendValue(value);
    }
});

// Allows keyboard input as well as button clicks.
document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (/^[0-9.]$/.test(key)) {
        appendValue(key);
    } else if (["+", "-", "*", "/"].includes(key)) {
        appendValue(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        showResult();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearCalculator();
    }
});
