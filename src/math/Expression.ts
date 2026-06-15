type BinaryOperator = 'add' | 'subtract' | 'multiply' | 'divide' | 'power';

export type ExpressionNode =
  | { kind: 'constant'; value: number }
  | { kind: 'variable' }
  | { kind: 'unary'; argument: ExpressionNode }
  | { kind: 'binary'; operator: BinaryOperator; left: ExpressionNode; right: ExpressionNode };

type Token =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' | '^' }
  | { type: 'leftParen' }
  | { type: 'rightParen' };

type OperatorTokenValue = Extract<Token, { type: 'operator' }>['value'];

interface SignedTerm {
  sign: 1 | -1;
  node: ExpressionNode;
}

export interface ParsedExpression {
  node: ExpressionNode;
  expr: string;
}

export type DifferentiationResult =
  | { valid: true; expr: string }
  | { valid: false };

export function parseExpression(input: number | string): ParsedExpression {
  const node =
    typeof input === 'number'
      ? createConstant(input)
      : new ExpressionParser(tokenize(input)).parse();

  return normalizeExpression(node);
}

export function differentiate(expr: string): DifferentiationResult {
  try {
    const expression = parseExpression(expr);
    const derivative = normalizeExpression(differentiateNode(expression.node));

    return { valid: true, expr: derivative.expr };
  } catch {
    return { valid: false };
  }
}

export function addToExpression(
  expression: ParsedExpression,
  amount: number,
): ParsedExpression {
  return normalizeExpression({
    kind: 'binary',
    operator: amount >= 0 ? 'add' : 'subtract',
    left: expression.node,
    right: createConstant(Math.abs(amount)),
  });
}

export function evaluateExpression(
  expression: ParsedExpression,
  x: number,
): number {
  return evaluateNode(expression.node, x);
}

export function isConstantExpressionValue(
  expression: ParsedExpression,
  expectedValue: number,
): boolean {
  return (
    expression.node.kind === 'constant' &&
    expression.node.value === expectedValue
  );
}

function normalizeExpression(node: ExpressionNode): ParsedExpression {
  const simplifiedNode = simplifyNode(node);

  return {
    node: simplifiedNode,
    expr: formatNode(simplifiedNode),
  };
}

function createConstant(value: number): ExpressionNode {
  if (!Number.isFinite(value)) {
    throw new Error(`Enemy expression constants must be finite numbers: ${value}`);
  }

  return { kind: 'constant', value };
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < input.length) {
    const character = input[index];

    if (character === ' ' || character === '\t' || character === '\n' || character === '\r') {
      index += 1;
      continue;
    }

    if (isDigit(character) || character === '.') {
      const start = index;
      index += 1;

      while (index < input.length && (isDigit(input[index]) || input[index] === '.')) {
        index += 1;
      }

      const valueText = input.slice(start, index);
      const value = Number(valueText);

      if (!Number.isFinite(value)) {
        throw new Error(`Invalid number in enemy expression: ${valueText}`);
      }

      tokens.push({ type: 'number', value });
      continue;
    }

    if (character === 'x' || character === 'X') {
      tokens.push({ type: 'identifier', value: 'x' });
      index += 1;
      continue;
    }

    if (
      character === '+' ||
      character === '-' ||
      character === '*' ||
      character === '/' ||
      character === '^'
    ) {
      tokens.push({ type: 'operator', value: character });
      index += 1;
      continue;
    }

    if (character === '(') {
      tokens.push({ type: 'leftParen' });
      index += 1;
      continue;
    }

    if (character === ')') {
      tokens.push({ type: 'rightParen' });
      index += 1;
      continue;
    }

    throw new Error(`Unsupported token in enemy expression: ${character}`);
  }

  return tokens;
}

function isDigit(value: string): boolean {
  return value >= '0' && value <= '9';
}

class ExpressionParser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ExpressionNode {
    const expression = this.parseAdditive();

    if (!this.isAtEnd()) {
      throw new Error('Unexpected token at end of enemy expression.');
    }

    return expression;
  }

  private parseAdditive(): ExpressionNode {
    let expression = this.parseMultiplicative();

    while (this.matchOperator('+') || this.matchOperator('-')) {
      const operator = this.previousOperator();
      const right = this.parseMultiplicative();

      expression = {
        kind: 'binary',
        operator: operator === '+' ? 'add' : 'subtract',
        left: expression,
        right,
      };
    }

    return expression;
  }

  private parseMultiplicative(): ExpressionNode {
    let expression = this.parseUnary();

    while (
      this.matchOperator('*') ||
      this.matchOperator('/') ||
      this.isImplicitMultiplication()
    ) {
      const operator = this.previousOperatorOrImplicitMultiply();
      const right = this.parseUnary();

      expression = {
        kind: 'binary',
        operator: operator === '/' ? 'divide' : 'multiply',
        left: expression,
        right,
      };
    }

    return expression;
  }

  private parsePower(): ExpressionNode {
    const left = this.parsePrimary();

    if (!this.matchOperator('^')) {
      return left;
    }

    return {
      kind: 'binary',
      operator: 'power',
      left,
      right: this.parseUnary(),
    };
  }

  private parseUnary(): ExpressionNode {
    if (this.matchOperator('+')) {
      return this.parseUnary();
    }

    if (this.matchOperator('-')) {
      return {
        kind: 'unary',
        argument: this.parseUnary(),
      };
    }

    return this.parsePower();
  }

  private parsePrimary(): ExpressionNode {
    const token = this.advance();

    if (token === undefined) {
      throw new Error('Unexpected end of enemy expression.');
    }

    if (token.type === 'number') {
      return createConstant(token.value);
    }

    if (token.type === 'identifier') {
      return { kind: 'variable' };
    }

    if (token.type === 'leftParen') {
      const expression = this.parseAdditive();

      if (!this.matchRightParen()) {
        throw new Error('Expected closing parenthesis in enemy expression.');
      }

      return expression;
    }

    throw new Error('Expected number, x, or parenthesized enemy expression.');
  }

  private matchOperator(operator: OperatorTokenValue): boolean {
    const token = this.peek();

    if (token?.type !== 'operator' || token.value !== operator) {
      return false;
    }

    this.index += 1;
    return true;
  }

  private matchRightParen(): boolean {
    const token = this.peek();

    if (token?.type !== 'rightParen') {
      return false;
    }

    this.index += 1;
    return true;
  }

  private previousOperator(): OperatorTokenValue {
    const token = this.tokens[this.index - 1];

    if (token?.type !== 'operator') {
      throw new Error('Expected enemy expression operator.');
    }

    return token.value;
  }

  private previousOperatorOrImplicitMultiply(): OperatorTokenValue {
    const token = this.tokens[this.index - 1];

    if (token?.type === 'operator') {
      return token.value;
    }

    return '*';
  }

  private isImplicitMultiplication(): boolean {
    const token = this.peek();

    return token?.type === 'number' || token?.type === 'identifier' || token?.type === 'leftParen';
  }

  private advance(): Token | undefined {
    const token = this.peek();

    if (token !== undefined) {
      this.index += 1;
    }

    return token;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private isAtEnd(): boolean {
    return this.index >= this.tokens.length;
  }
}

function differentiateNode(node: ExpressionNode): ExpressionNode {
  switch (node.kind) {
    case 'constant':
      return createConstant(0);
    case 'variable':
      return createConstant(1);
    case 'unary':
      return {
        kind: 'unary',
        argument: differentiateNode(node.argument),
      };
    case 'binary':
      return differentiateBinary(node);
  }
}

function differentiateBinary(
  node: ExpressionNode & { kind: 'binary' },
): ExpressionNode {
  switch (node.operator) {
    case 'add':
    case 'subtract':
      return {
        kind: 'binary',
        operator: node.operator,
        left: differentiateNode(node.left),
        right: differentiateNode(node.right),
      };
    case 'multiply':
      return differentiateProduct(node.left, node.right);
    case 'divide':
      return differentiateQuotient(node.left, node.right);
    case 'power':
      return differentiatePower(node.left, node.right);
  }
}

function differentiateProduct(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  return {
    kind: 'binary',
    operator: 'add',
    left: {
      kind: 'binary',
      operator: 'multiply',
      left: differentiateNode(left),
      right,
    },
    right: {
      kind: 'binary',
      operator: 'multiply',
      left,
      right: differentiateNode(right),
    },
  };
}

function differentiateQuotient(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  if (containsVariable(right)) {
    throw new Error('Variable denominators are not supported for derivative attacks.');
  }

  return {
    kind: 'binary',
    operator: 'divide',
    left: differentiateNode(left),
    right,
  };
}

function differentiatePower(left: ExpressionNode, right: ExpressionNode): ExpressionNode {
  if (right.kind !== 'constant' || !isSafePolynomialExponent(right.value)) {
    throw new Error('Only non-negative integer powers are supported for derivative attacks.');
  }

  if (right.value === 0) {
    return createConstant(0);
  }

  const loweredPower =
    right.value === 1
      ? createConstant(1)
      : {
          kind: 'binary' as const,
          operator: 'power' as const,
          left,
          right: createConstant(right.value - 1),
        };

  return {
    kind: 'binary',
    operator: 'multiply',
    left: {
      kind: 'binary',
      operator: 'multiply',
      left: createConstant(right.value),
      right: loweredPower,
    },
    right: differentiateNode(left),
  };
}

function isSafePolynomialExponent(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function containsVariable(node: ExpressionNode): boolean {
  switch (node.kind) {
    case 'constant':
      return false;
    case 'variable':
      return true;
    case 'unary':
      return containsVariable(node.argument);
    case 'binary':
      return containsVariable(node.left) || containsVariable(node.right);
  }
}

function simplifyNode(node: ExpressionNode): ExpressionNode {
  switch (node.kind) {
    case 'constant':
    case 'variable':
      return node;
    case 'unary':
      return simplifyUnary(node.argument);
    case 'binary':
      return simplifyBinary(node.operator, node.left, node.right);
  }
}

function simplifyUnary(argument: ExpressionNode): ExpressionNode {
  const simplifiedArgument = simplifyNode(argument);

  if (simplifiedArgument.kind === 'constant') {
    return createConstant(-simplifiedArgument.value);
  }

  if (simplifiedArgument.kind === 'unary') {
    return simplifiedArgument.argument;
  }

  return { kind: 'unary', argument: simplifiedArgument };
}

function simplifyBinary(
  operator: BinaryOperator,
  left: ExpressionNode,
  right: ExpressionNode,
): ExpressionNode {
  const simplifiedLeft = simplifyNode(left);
  const simplifiedRight = simplifyNode(right);

  if (operator === 'add' || operator === 'subtract') {
    return simplifyAdditive(operator, simplifiedLeft, simplifiedRight);
  }

  if (simplifiedLeft.kind === 'constant' && simplifiedRight.kind === 'constant') {
    return createConstant(evaluateBinary(operator, simplifiedLeft.value, simplifiedRight.value));
  }

  if (operator === 'multiply') {
    if (isConstantValue(simplifiedLeft, 0) || isConstantValue(simplifiedRight, 0)) {
      return createConstant(0);
    }

    const combinedConstantProduct = combineConstantMultiplication(
      simplifiedLeft,
      simplifiedRight,
    );

    if (combinedConstantProduct !== undefined) {
      return combinedConstantProduct;
    }

    if (isConstantValue(simplifiedLeft, 1)) return simplifiedRight;
    if (isConstantValue(simplifiedRight, 1)) return simplifiedLeft;
    if (isConstantValue(simplifiedLeft, -1)) return simplifyUnary(simplifiedRight);
    if (isConstantValue(simplifiedRight, -1)) return simplifyUnary(simplifiedLeft);
  }

  if (operator === 'divide') {
    if (isConstantValue(simplifiedLeft, 0)) return createConstant(0);
    if (isConstantValue(simplifiedRight, 1)) return simplifiedLeft;
  }

  if (operator === 'power') {
    if (isConstantValue(simplifiedRight, 0)) return createConstant(1);
    if (isConstantValue(simplifiedRight, 1)) return simplifiedLeft;
  }

  return {
    kind: 'binary',
    operator,
    left: simplifiedLeft,
    right: simplifiedRight,
  };
}

function combineConstantMultiplication(
  left: ExpressionNode,
  right: ExpressionNode,
): ExpressionNode | undefined {
  if (left.kind === 'constant') {
    const rightFactor = getConstantFactor(right);

    if (rightFactor !== undefined) {
      return simplifyBinary(
        'multiply',
        createConstant(left.value * rightFactor.constant),
        rightFactor.node,
      );
    }
  }

  if (right.kind === 'constant') {
    const leftFactor = getConstantFactor(left);

    if (leftFactor !== undefined) {
      return simplifyBinary(
        'multiply',
        createConstant(right.value * leftFactor.constant),
        leftFactor.node,
      );
    }
  }

  return undefined;
}

function getConstantFactor(
  node: ExpressionNode,
): { constant: number; node: ExpressionNode } | undefined {
  if (node.kind !== 'binary' || node.operator !== 'multiply') {
    return undefined;
  }

  if (node.left.kind === 'constant') {
    return { constant: node.left.value, node: node.right };
  }

  if (node.right.kind === 'constant') {
    return { constant: node.right.value, node: node.left };
  }

  return undefined;
}

function simplifyAdditive(
  operator: 'add' | 'subtract',
  left: ExpressionNode,
  right: ExpressionNode,
): ExpressionNode {
  const terms: SignedTerm[] = [];
  const constant =
    collectAdditiveTerms(left, 1, terms) +
    collectAdditiveTerms(right, operator === 'add' ? 1 : -1, terms);

  return buildAdditiveExpression(terms, constant);
}

function collectAdditiveTerms(
  node: ExpressionNode,
  sign: 1 | -1,
  terms: SignedTerm[],
): number {
  if (node.kind === 'constant') {
    return sign * node.value;
  }

  if (node.kind === 'binary' && node.operator === 'add') {
    return (
      collectAdditiveTerms(node.left, sign, terms) +
      collectAdditiveTerms(node.right, sign, terms)
    );
  }

  if (node.kind === 'binary' && node.operator === 'subtract') {
    return (
      collectAdditiveTerms(node.left, sign, terms) +
      collectAdditiveTerms(node.right, sign === 1 ? -1 : 1, terms)
    );
  }

  terms.push({ sign, node });
  return 0;
}

function buildAdditiveExpression(
  terms: SignedTerm[],
  constant: number,
): ExpressionNode {
  let expression: ExpressionNode | undefined;

  for (const term of terms) {
    const termNode = term.sign === 1 ? term.node : simplifyUnary(term.node);
    expression =
      expression === undefined
        ? termNode
        : {
            kind: 'binary',
            operator: 'add',
            left: expression,
            right: termNode,
          };
  }

  if (constant !== 0) {
    const constantNode = createConstant(constant);
    expression =
      expression === undefined
        ? constantNode
        : {
            kind: 'binary',
            operator: 'add',
            left: expression,
            right: constantNode,
          };
  }

  return expression ?? createConstant(0);
}

function isConstantValue(node: ExpressionNode, value: number): boolean {
  return node.kind === 'constant' && node.value === value;
}

function evaluateNode(node: ExpressionNode, x: number): number {
  switch (node.kind) {
    case 'constant':
      return node.value;
    case 'variable':
      return x;
    case 'unary':
      return -evaluateNode(node.argument, x);
    case 'binary':
      return evaluateBinary(
        node.operator,
        evaluateNode(node.left, x),
        evaluateNode(node.right, x),
      );
  }
}

function evaluateBinary(operator: BinaryOperator, left: number, right: number): number {
  switch (operator) {
    case 'add':
      return left + right;
    case 'subtract':
      return left - right;
    case 'multiply':
      return left * right;
    case 'divide':
      return left / right;
    case 'power':
      return left ** right;
  }
}

function formatNode(node: ExpressionNode, parentPrecedence = 0): string {
  switch (node.kind) {
    case 'constant':
      return formatNumber(node.value);
    case 'variable':
      return 'x';
    case 'unary':
      return formatUnary(node, parentPrecedence);
    case 'binary':
      return formatBinary(node, parentPrecedence);
  }
}

function formatUnary(node: ExpressionNode & { kind: 'unary' }, parentPrecedence: number): string {
  const text = `-${formatNode(node.argument, getPrecedence(node))}`;

  return getPrecedence(node) < parentPrecedence ? `(${text})` : text;
}

function formatBinary(
  node: ExpressionNode & { kind: 'binary' },
  parentPrecedence: number,
): string {
  if (node.operator === 'multiply') {
    return formatMultiplication(node, parentPrecedence);
  }

  if (node.operator === 'add' && node.right.kind === 'constant' && node.right.value < 0) {
    const text = `${formatNode(node.left, getPrecedence(node))} - ${formatNumber(
      Math.abs(node.right.value),
    )}`;

    return getPrecedence(node) < parentPrecedence ? `(${text})` : text;
  }

  const operatorText = getOperatorText(node.operator);
  const precedence = getPrecedence(node);
  const left = formatNode(node.left, precedence);
  const right = formatNode(node.right, getRightPrecedence(node));
  const separator = node.operator === 'add' || node.operator === 'subtract' ? ' ' : '';
  const text = `${left}${separator}${operatorText}${separator}${right}`;

  return precedence < parentPrecedence ? `(${text})` : text;
}

function formatMultiplication(
  node: ExpressionNode & { kind: 'binary'; operator: 'multiply' },
  parentPrecedence: number,
): string {
  const precedence = getPrecedence(node);
  const text =
    node.left.kind === 'constant' && canUseCoefficientNotation(node.right)
      ? `${formatNumber(node.left.value)}${formatNode(node.right, precedence)}`
      : `${formatNode(node.left, precedence)}*${formatNode(node.right, precedence)}`;

  return precedence < parentPrecedence ? `(${text})` : text;
}

function canUseCoefficientNotation(node: ExpressionNode): boolean {
  return node.kind === 'variable' || node.kind === 'binary';
}

function getOperatorText(operator: BinaryOperator): string {
  switch (operator) {
    case 'add':
      return '+';
    case 'subtract':
      return '-';
    case 'multiply':
      return '*';
    case 'divide':
      return '/';
    case 'power':
      return '^';
  }
}

function getRightPrecedence(node: ExpressionNode & { kind: 'binary' }): number {
  const precedence = getPrecedence(node);

  if (node.operator === 'subtract' || node.operator === 'divide') {
    return precedence + 1;
  }

  if (node.operator === 'power') {
    return precedence;
  }

  return precedence;
}

function getPrecedence(node: ExpressionNode): number {
  if (node.kind === 'constant' || node.kind === 'variable') return 5;
  if (node.kind === 'unary') return 4;
  if (node.operator === 'power') return 3;
  if (node.operator === 'multiply' || node.operator === 'divide') return 2;

  return 1;
}

function formatNumber(value: number): string {
  return Object.is(value, -0) ? '0' : value.toString();
}
