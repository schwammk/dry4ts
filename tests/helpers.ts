import ts from 'typescript';
import { CodeUnit } from '../src/units.js';

export function firstFunctionUnit(code: string, file = 't.ts', name = 'f'): CodeUnit {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.ES2022, true);
  let fn: ts.Node | undefined;
  sf.forEachChild(function walk(n) {
    if (ts.isFunctionDeclaration(n)) fn = n;
    else n.forEachChild(walk);
  });
  if (fn === undefined) throw new Error('no function in test source');
  const start = sf.getLineAndCharacterOfPosition(fn.getStart(sf));
  const end = sf.getLineAndCharacterOfPosition(fn.getEnd());
  return {
    file,
    name,
    startLine: start.line + 1,
    endLine: end.line + 1,
    node: fn
  };
}
