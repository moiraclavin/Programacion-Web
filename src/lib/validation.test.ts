import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isValidEmail, isValidPassword, isValidName, isValidPhone, isValidCapacity } from './validation.ts';

describe('isValidEmail', () => {
  it('acepta emails válidos', () => {
    assert.equal(isValidEmail('ana@correo.com'), true);
    assert.equal(isValidEmail('  ana@correo.com  '), true);
  });

  it('rechaza emails inválidos', () => {
    assert.equal(isValidEmail(''), false);
    assert.equal(isValidEmail('sin-arroba'), false);
    assert.equal(isValidEmail('sin@dominio'), false);
    assert.equal(isValidEmail('@falta-nombre.com'), false);
    assert.equal(isValidEmail('tiene espacio@correo.com'), false);
  });
});

describe('isValidPassword', () => {
  it('acepta contraseñas con al menos 8 caracteres, una letra y un número', () => {
    assert.equal(isValidPassword('abcdef12'), true);
    assert.equal(isValidPassword('A1bcdefg'), true);
    assert.equal(isValidPassword('12345678a'), true);
  });

  it('rechaza contraseñas cortas, sin letras o sin números', () => {
    assert.equal(isValidPassword('abc1234'), false, 'menos de 8');
    assert.equal(isValidPassword('abcdefgh'), false, 'sin números');
    assert.equal(isValidPassword('12345678'), false, 'sin letras');
    assert.equal(isValidPassword(''), false, 'vacía');
  });
});

describe('isValidName', () => {
  it('acepta nombres dentro del rango', () => {
    assert.equal(isValidName('Ana'), true);
    assert.equal(isValidName('Jo'), true);
    assert.equal(isValidName('A'.repeat(80)), true);
  });

  it('rechaza nombres fuera del rango', () => {
    assert.equal(isValidName(''), false);
    assert.equal(isValidName('A'), false);
    assert.equal(isValidName('  A  '), false, 'trim deja 1 carácter');
    assert.equal(isValidName('A'.repeat(81)), false);
  });
});

describe('isValidPhone', () => {
  it('acepta celulares argentinos válidos', () => {
    assert.equal(isValidPhone('11 5555 5555'), true);
    assert.equal(isValidPhone('+54 9 11 5555 5555'), true);
    assert.equal(isValidPhone('011 5555-5555'), true);
  });

  it('rechaza números inválidos', () => {
    assert.equal(isValidPhone(''), false);
    assert.equal(isValidPhone('123'), false);
    assert.equal(isValidPhone('no-es-un-numero'), false);
  });
});

describe('isValidCapacity', () => {
  it('acepta enteros entre 1 y 30', () => {
    assert.equal(isValidCapacity(1), true);
    assert.equal(isValidCapacity(8), true);
    assert.equal(isValidCapacity(30), true);
  });

  it('rechaza valores fuera de rango o no enteros', () => {
    assert.equal(isValidCapacity(0), false);
    assert.equal(isValidCapacity(31), false);
    assert.equal(isValidCapacity(-1), false);
    assert.equal(isValidCapacity(5.5), false);
  });
});
