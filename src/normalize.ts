import ts from 'typescript';

export interface Marker {
  tag: string;
  children?: Marker[];
}

function leaf(tag: string): Marker {
  return { tag };
}

function inner(tag: string, children: Marker[]): Marker {
  return { tag, children };
}

const LITERAL_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.NumericLiteral,
  ts.SyntaxKind.BigIntLiteral,
  ts.SyntaxKind.StringLiteral,
  ts.SyntaxKind.NoSubstitutionTemplateLiteral,
  ts.SyntaxKind.RegularExpressionLiteral,
  ts.SyntaxKind.TrueKeyword,
  ts.SyntaxKind.FalseKeyword,
  ts.SyntaxKind.NullKeyword
]);

const UNARY_OPERATOR_TEXT: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.PlusToken]: '+',
  [ts.SyntaxKind.MinusToken]: '-',
  [ts.SyntaxKind.TildeToken]: '~',
  [ts.SyntaxKind.ExclamationToken]: '!',
  [ts.SyntaxKind.PlusPlusToken]: '++',
  [ts.SyntaxKind.MinusMinusToken]: '--'
};

export function normalizeNode(node: ts.Node): Marker {
  return normalize(node);
}

function normalize(node: ts.Node): Marker {
  if (LITERAL_KINDS.has(node.kind)) {
    return leaf(':literal');
  }
  if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
    return leaf(':id');
  }
  if (ts.isPropertyAccessExpression(node)) {
    return inner(':access', [normalize(node.expression), leaf(`:prop ${node.name.getText()}`)]);
  }
  if (ts.isElementAccessExpression(node)) {
    return inner(':access', [normalize(node.expression), normalize(node.argumentExpression)]);
  }
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    const callee = ts.isIdentifier(node.expression)
      ? leaf(`:name ${node.expression.text}`)
      : normalize(node.expression);
    const args = (node.arguments ?? []).map(normalize);
    return inner(ts.isNewExpression(node) ? ':new' : ':call', [callee, ...args]);
  }
  if (ts.isTemplateExpression(node)) {
    return inner(':template', [
      leaf(':literal'),
      ...node.templateSpans.map((span) => normalize(span.expression))
    ]);
  }
  if (ts.isBinaryExpression(node)) {
    return inner(':binary', [
      leaf(`:op${node.operatorToken.getText()}`),
      normalize(node.left),
      normalize(node.right)
    ]);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return inner(':unary', [leaf(`:op${UNARY_OPERATOR_TEXT[node.operator] ?? '?'}`), normalize(node.operand)]);
  }
  return inner(`:${ts.SyntaxKind[node.kind]}`, childrenOf(node));
}

function childrenOf(node: ts.Node): Marker[] {
  const children: Marker[] = [];
  ts.forEachChild(node, (child) => {
    children.push(normalize(child));
  });
  return children;
}
