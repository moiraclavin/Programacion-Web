import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { whatsappNumber } from './phone.ts';
import { isValidEmail } from './validation.ts';

describe('whatsappNumber', () => {
  it('normaliza los formatos habituales de un celular argentino', () => {
    for (const raw of ['11 5555-5555', '011 5555 5555', '+54 11 5555 5555', '+54 9 11 5555 5555', '5491155555555', '(11) 5555.5555']) {
      assert.equal(whatsappNumber(raw), '5491155555555', raw);
    }
  });

  it('rechaza lo que no parece un número', () => {
    for (const raw of ['', 'abc', '123', '11 5555', '+54 9 11 5555 55555']) {
      assert.equal(whatsappNumber(raw), null, raw);
    }
  });
});

describe('isValidEmail', () => {
  it('acepta emails con formato válido', () => {
    assert.equal(isValidEmail('ana@gmail.com'), true);
    assert.equal(isValidEmail('  ana.perez+pilates@mail.com.ar '), true);
  });

  it('rechaza emails mal escritos', () => {
    for (const value of ['', 'ana', 'ana@', 'ana@gmail', '@gmail.com', 'ana perez@gmail.com']) {
      assert.equal(isValidEmail(value), false, value);
    }
  });
});
