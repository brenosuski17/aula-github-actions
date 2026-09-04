(function (global) {
  'use strict';

  var FORMATO_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var FORMATO_NOME = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
  var IDADE_MINIMA_CNH = 18;
  var IDADE_MAXIMA = 120;

  function DadosInvalidosError(erros) {
    var instance = new Error('Dados invalidos: ' + erros.join('; '));
    instance.name = 'DadosInvalidosError';
    instance.erros = erros;
    Object.setPrototypeOf(instance, DadosInvalidosError.prototype);
    return instance;
  }
  DadosInvalidosError.prototype = Object.create(Error.prototype);
  DadosInvalidosError.prototype.constructor = DadosInvalidosError;

  function soDigitos(texto) {
    return (texto == null ? '' : texto).toString().replace(/\D/g, '');
  }

  /**
   * Calcula os dois digitos verificadores do CPF e confere tamanho,
   * mascara e sequencias repetidas (111.111.111-11 e amigos).
   */
  function cpfValido(cpf) {
    var numeros = soDigitos(cpf);
    if (numeros.length !== 11) return false;
    if (numeros === numeros[0].repeat(11)) return false;

    var quantidades = [9, 10];
    for (var q = 0; q < quantidades.length; q++) {
      var quantidade = quantidades[q];
      var soma = 0;
      for (var i = 0; i < quantidade; i++) {
        soma += Number(numeros[i]) * (quantidade + 1 - i);
      }
      var digito = ((soma * 10) % 11) % 10;
      if (digito !== Number(numeros[quantidade])) return false;
    }
    return true;
  }

  /**
   * Idade em anos completos na data "hoje", comparando ano/mes/dia.
   * NAO usar (hoje - nascimento) / 365: quem faz aniversario hoje
   * conta como tendo feito idade, quem faz amanha ainda nao.
   */
  function idadeEm(dataNascimento, hoje) {
    var idade = hoje.getUTCFullYear() - dataNascimento.getUTCFullYear();
    var mesDiff = hoje.getUTCMonth() - dataNascimento.getUTCMonth();
    var diaDiff = hoje.getUTCDate() - dataNascimento.getUTCDate();
    if (mesDiff < 0 || (mesDiff === 0 && diaDiff < 0)) {
      idade -= 1;
    }
    return idade;
  }

  /** Converte "AAAA-MM-DD" em Date (UTC), validando que a data existe de verdade. */
  function parseDataISO(texto) {
    if (typeof texto !== 'string') return null;
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
    if (!match) return null;

    var ano = Number(match[1]);
    var mes = Number(match[2]);
    var dia = Number(match[3]);
    var data = new Date(Date.UTC(ano, mes - 1, dia));

    var dataExisteDeVerdade =
      data.getUTCFullYear() === ano &&
      data.getUTCMonth() === mes - 1 &&
      data.getUTCDate() === dia;

    return dataExisteDeVerdade ? data : null;
  }

  function validarNome(nome, erros) {
    var valor = (nome == null ? '' : nome).toString().trim();

    if (!valor) {
      erros.push('nome: obrigatorio');
      return;
    }
    if (valor.length < 3) {
      erros.push('nome: tamanho minimo de 3 caracteres');
      return;
    }
    if (valor.length > 80) {
      erros.push('nome: tamanho maximo de 80 caracteres');
      return;
    }
    if (!FORMATO_NOME.test(valor)) {
      erros.push('nome: use apenas letras, espaco, apostrofo e hifen');
      return;
    }

    var palavras = valor
      .split(/\s+/)
      .filter(function (p) {
        return p.replace(/['-]/g, '').length >= 2;
      });

    if (palavras.length < 2) {
      erros.push('nome: informe nome e sobrenome');
    }
  }

  function validarNascimento(dataNascimento, hoje, erros) {
    var data = parseDataISO(dataNascimento);
    if (!data) {
      erros.push('data_nascimento: invalida');
      return null;
    }
    if (data.getTime() > hoje.getTime()) {
      erros.push('data_nascimento: nao pode estar no futuro');
      return null;
    }
    if (idadeEm(data, hoje) > IDADE_MAXIMA) {
      erros.push('data_nascimento: idade maxima de 120 anos');
      return null;
    }
    return data;
  }

  /**
   * Devolve a LISTA de erros (vazia = tudo certo). Nao levanta excecao.
   * hoje: Date opcional, usado nos testes para nao depender do dia real.
   */
  function validar(pessoa, hoje) {
    var dataReferencia = hoje || new Date();
    var erros = [];
    pessoa = pessoa || {};

    validarNome(pessoa.nome, erros);

    if (!cpfValido(pessoa.cpf)) {
      erros.push('cpf: invalido');
    }

    var email = (pessoa.email == null ? '' : pessoa.email).toString().trim();
    if (!FORMATO_EMAIL.test(email)) {
      erros.push('email: invalido');
    }

    var nascimento = validarNascimento(pessoa.data_nascimento, dataReferencia, erros);

    var possuiCnh = pessoa.possui_cnh;
    if (typeof possuiCnh !== 'boolean') {
      erros.push('possui_cnh: informe true ou false');
    } else if (
      possuiCnh &&
      nascimento &&
      idadeEm(nascimento, dataReferencia) < IDADE_MINIMA_CNH
    ) {
      erros.push('possui_cnh: so a partir de 18 anos');
    }

    return erros;
  }

  /** Mesma validacao, mas levanta DadosInvalidosError com a lista de erros. */
  function garantirValido(pessoa, hoje) {
    var erros = validar(pessoa, hoje);
    if (erros.length > 0) {
      throw new DadosInvalidosError(erros);
    }
    return true;
  }

  var api = {
    validar: validar,
    garantirValido: garantirValido,
    cpfValido: cpfValido,
    soDigitos: soDigitos,
    idadeEm: idadeEm,
    DadosInvalidosError: DadosInvalidosError,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.PessoaFisica = api;
  }
})(typeof window !== 'undefined' ? window : this);
