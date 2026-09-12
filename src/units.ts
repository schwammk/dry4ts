import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { listSourceFiles } from './walk.js';

export interface CodeUnit {
  file: string;
  name: string;
  startLine: number;
  endLine: number;
  node: ts.Node;
  body: ts.Node;
}

const FUNCTION_LIKE = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor
]);

export function collectUnits(
  sourceRoot: string,
  nestedBlocks: boolean,
  warn: (message: string) => void
): CodeUnit[] {
  const units: CodeUnit[] = [];
  let blockSeq = 0;
  for (const path of listSourceFiles(sourceRoot)) {
    const sourceFile = parseSourceFile(path, warn);
    if (sourceFile === null) continue;
    const fnStack: string[] = [];
    const visit = (node: ts.Node): void => {
      if (FUNCTION_LIKE.has(node.kind)) {
        const name = unitName(node, sourceFile);
        units.push(makeUnit(node, name, sourceFile));
        fnStack.push(name);
        ts.forEachChild(node, visit);
        fnStack.pop();
        return;
      }
      if (nestedBlocks && ts.isBlock(node) && !isFunctionBody(node)) {
        const owner = fnStack[fnStack.length - 1] ?? '<top>';
        units.push(makeUnit(node, `${owner}#block${++blockSeq}`, sourceFile));
      }
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(sourceFile, visit);
  }
  return units;
}

function isFunctionBody(node: ts.Node): boolean {
  const parent = node.parent as ts.FunctionLikeDeclaration | undefined;
  return parent !== undefined && FUNCTION_LIKE.has(parent.kind) && parent.body === node;
}

function parseSourceFile(path: string, warn: (message: string) => void): ts.SourceFile | null {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    warn(`cannot read, skipped: ${path}`);
    return null;
  }
  const sourceFile = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.ES2022,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const parseDiagnostics = (sourceFile as ts.SourceFile & { parseDiagnostics?: ts.Diagnostic[] })
    .parseDiagnostics;
  if (parseDiagnostics !== undefined && parseDiagnostics.length > 0) {
    warn(`cannot parse, skipped: ${path}`);
    return null;
  }
  return sourceFile;
}

function unitName(node: ts.Node, sourceFile: ts.SourceFile): string {
  const fn = node as ts.FunctionLikeDeclaration;
  if (ts.isConstructorDeclaration(node)) {
    return `${ownerName(node.parent)}.constructor`;
  }
  if (ts.isMethodDeclaration(node) || ts.isGetAccessor(node) || ts.isSetAccessor(node)) {
    const owner = node.parent;
    if (ts.isObjectLiteralExpression(owner)) {
      return fn.name !== undefined && ts.isIdentifier(fn.name)
        ? fn.name.text
        : `<anonymous:${lineOf(node, sourceFile)}>`;
    }
    return `${ownerName(owner)}.${
      fn.name !== undefined && ts.isIdentifier(fn.name) ? fn.name.text : '<computed>'
    }`;
  }
  if (fn.name !== undefined && ts.isIdentifier(fn.name)) {
    return fn.name.text;
  }
  const parent = node.parent;
  if (
    (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) &&
    ts.isIdentifier(parent.name)
  ) {
    return parent.name.text;
  }
  return `<anonymous:${lineOf(node, sourceFile)}>`;
}

function ownerName(owner: ts.Node): string {
  if (ts.isClassDeclaration(owner) || ts.isClassExpression(owner)) {
    return owner.name !== undefined ? owner.name.text : '<anonymous>';
  }
  return '<anonymous>';
}

function lineOf(node: ts.Node, sourceFile: ts.SourceFile): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function makeUnit(node: ts.Node, name: string, sourceFile: ts.SourceFile): CodeUnit {
  let startNode = node;
  let endNode = node;
  if (ts.isBlock(node) && node.statements.length > 0) {
    startNode = node.statements[0];
    endNode = node.statements[node.statements.length - 1];
  }
  const start = sourceFile.getLineAndCharacterOfPosition(startNode.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(endNode.getEnd());
  const fn = node as ts.FunctionLikeDeclaration;
  return {
    file: sourceFile.fileName,
    name,
    startLine: start.line + 1,
    endLine: end.line + 1,
    node,
    body: fn.body ?? node
  };
}
