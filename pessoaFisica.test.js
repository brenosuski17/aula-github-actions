'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  validar,
  garantirValido,
  cpfValido,
  DadosInvalidosError,
} = require('./pessoaFisica');

const HOJE = new Date(Date.UTC(2026, 7, 21)); // 2026-08-21, o "relogio" injetado

const pessoa = (mudancas = {}) => ({
  nome: 'Ana Maria Souza',
  cpf: '529.982.247-25',
  email: 'ana.souza@escola.com.br',
  data_nascimento: '1998-03-14',
  possui_cnh: true,
  ...mudancas,
});

const temErro = (erros, trecho) => erros.some((e) => e.includes(trecho));

// 1) a linha reta
test('caminho feliz: cadastro completo e valido', () => {
  assert.deepEqual(validar(pessoa(), HOJE), []);
});

test('nome com hifen e apostrofo e valido', () => {
  assert.deepEqual(validar(pessoa({ nome: "Ana-Clara D'Avila Souza" }), HOJE), []);
});

// 2) as linhas tortas - nome
describe('nome invalido', () => {
  const casos = [
    ['', 'obrigatorio'],
    ['   ', 'obrigatorio'],
    ['Al', 'minimo'],
    ['A'.repeat(81), 'maximo'],
    ['Ana', 'sobrenome'],
    ['Ana Souza 3', 'letras'],
    ['Ana_Souza', 'letras'],
  ];
  for (const [nome, trecho] of casos) {
    test(`invalido: ${JSON.stringify(nome)} -> ${trecho}`, () => {
      assert.ok(temErro(validar(pessoa({ nome }), HOJE), trecho));
    });
  }
});

// cpf
describe('cpf', () => {
  const invalidos = ['111.111.111-11', '529.982.247-24', '5299822472', '', null, undefined];
  for (const cpf of invalidos) {
    test(`cpfValido rejeita: ${JSON.stringify(cpf)}`, () => {
      assert.equal(cpfValido(cpf), false);
    });
  }

  test('cpf com mascara valida e aceito', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
  });

  test('cadastro com cpf invalido gera erro', () => {
    assert.ok(temErro(validar(pessoa({ cpf: '123' }), HOJE), 'cpf: invalido'));
  });
});

// email
describe('email invalido', () => {
  const casos = ['', 'sem-arroba.com', 'a@b', 'a b@dominio.com', '@dominio.com', 'a@dominio'];
  for (const email of casos) {
    test(`invalido: ${JSON.stringify(email)}`, () => {
      assert.ok(temErro(validar(pessoa({ email }), HOJE), 'email: invalido'));
    });
  }

  test('email valido nao gera erro', () => {
    const erros = validar(pessoa({ email: 'nome.sobrenome@dominio.com.br' }), HOJE);
    assert.equal(temErro(erros, 'email'), false);
  });
});

// data_nascimento
describe('data_nascimento invalida', () => {
  test('formato errado (nao e AAAA-MM-DD)', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '14/03/1998' }), HOJE), 'data_nascimento'));
  });

  test('data que nao existe de verdade (30 de fevereiro)', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '2020-02-30' }), HOJE), 'data_nascimento'));
  });

  test('data no futuro', () => {
    const erros = validar(pessoa({ data_nascimento: '2030-01-01' }), HOJE);
    assert.ok(temErro(erros, 'nao pode estar no futuro'));
  });

  test('idade acima de 120 anos', () => {
    assert.ok(temErro(validar(pessoa({ data_nascimento: '1900-01-01' }), HOJE), 'data_nascimento'));
  });
});

// possui_cnh + a fronteira dos 18 anos
describe('possui_cnh', () => {
  test('tipo errado (string "sim") gera erro', () => {
    const erros = validar(pessoa({ possui_cnh: 'sim' }), HOJE);
    assert.ok(temErro(erros, 'possui_cnh: informe true ou false'));
  });

  test('false nao exige idade minima', () => {
    const erros = validar(pessoa({ data_nascimento: '2015-01-01', possui_cnh: false }), HOJE);
    assert.equal(temErro(erros, 'possui_cnh'), false);
  });

  // 3) a fronteira - o bug mais comum da aula
  test('faz 18 anos exatamente hoje: pode ter cnh', () => {
    assert.deepEqual(
      validar(pessoa({ data_nascimento: '2008-08-21', possui_cnh: true }), HOJE),
      []
    );
  });

  test('faz 18 anos amanha: ainda nao pode', () => {
    const erros = validar(pessoa({ data_nascimento: '2008-08-22', possui_cnh: true }), HOJE);
    assert.ok(temErro(erros, 'possui_cnh'));
  });
});

// 4) a combinacao
test('acumula todos os erros de uma vez (nao para no primeiro)', () => {
  const erros = validar(
    {
      nome: 'Al',
      cpf: '123',
      email: 'x',
      data_nascimento: '2030-01-01',
      possui_cnh: 'sim',
    },
    HOJE
  );
  assert.ok(erros.length >= 5, `esperava >= 5 erros, veio ${erros.length}: ${erros}`);
});

// 5) a excecao
test('garantirValido lanca a excecao com a lista de erros', () => {
  assert.throws(
    () => garantirValido(pessoa({ cpf: '111.111.111-11' }), HOJE),
    (erro) => {
      assert.ok(erro instanceof DadosInvalidosError);
      assert.deepEqual(erro.erros, ['cpf: invalido']);
      return true;
    }
  );
});

test('garantirValido nao lanca quando o cadastro e valido', () => {
  assert.doesNotThrow(() => garantirValido(pessoa(), HOJE));
});
