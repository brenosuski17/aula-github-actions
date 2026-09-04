const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cpfValido } = require('./pessoaFisica');

test('bug proposital: cpf invalido nao deveria ser true', () => {
  assert.equal(cpfValido('111.111.111-11'), true); // errado de proposito
});