const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cpfValido } = require('./pessoaFisica');

test('cpf com todos os digitos iguais deve ser invalido', () => {
  assert.equal(cpfValido('111.111.111-11'), false);
});