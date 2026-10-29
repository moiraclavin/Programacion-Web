import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canPay, monthState } from './months.ts';

const current = '2026-10-01';

describe('monthState', () => {
  it('un mes pagado es pagado, sea pasado, actual o futuro', () => {
    for (const period of ['2026-05-01', '2026-10-01', '2027-02-01']) {
      assert.equal(monthState(period, current, true), 'paid');
    }
  });

  it('distingue el mes actual, los futuros y los pasados sin pagar', () => {
    assert.equal(monthState('2026-10-01', current, false), 'due');
    assert.equal(monthState('2026-11-01', current, false), 'upcoming');
    assert.equal(monthState('2027-03-01', current, false), 'upcoming');
    assert.equal(monthState('2026-09-01', current, false), 'missed');
  });
});

describe('canPay', () => {
  it('se puede pagar el actual y los futuros hasta 12 meses adelante', () => {
    assert.equal(canPay('due', '2026-10-01', current), true);
    assert.equal(canPay('upcoming', '2026-11-01', current), true);
    assert.equal(canPay('upcoming', '2027-10-01', current), true);
  });

  it('no se puede pagar lo ya pagado, lo pasado ni lo muy lejano', () => {
    assert.equal(canPay('paid', '2026-11-01', current), false);
    assert.equal(canPay('missed', '2026-09-01', current), false);
    assert.equal(canPay('upcoming', '2027-11-01', current), false);
  });
});
