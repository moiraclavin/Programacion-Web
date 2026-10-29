import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, addMonths, mondayOf, periodsOfYear, shiftMonth, slotStart, startOfDay } from './dates.ts';

describe('slotStart', () => {
  it('arma el instante de una clase en hora de Buenos Aires', () => {
    assert.equal(slotStart('2026-10-12', 8).toISOString(), '2026-10-12T11:00:00.000Z');
    assert.equal(slotStart('2026-10-12', 20).toISOString(), '2026-10-12T23:00:00.000Z');
    // Una clase de las 21 ya cae al día siguiente en UTC, pero sigue siendo del 12 en Argentina.
    assert.equal(slotStart('2026-10-12', 21).toISOString(), '2026-10-13T00:00:00.000Z');
  });

  it('coincide con el inicio del día a las 00', () => {
    assert.equal(slotStart('2026-10-12', 0).getTime(), startOfDay('2026-10-12').getTime());
  });
});

describe('semanas y meses', () => {
  it('encuentra el lunes de cualquier día de la semana', () => {
    assert.equal(mondayOf('2026-10-12'), '2026-10-12');
    assert.equal(mondayOf('2026-10-18'), '2026-10-12'); // domingo
    assert.equal(addDays('2026-10-12', 7), '2026-10-19');
  });

  it('suma y resta meses cruzando de año', () => {
    assert.equal(addMonths('2026-11-01', 1), '2026-12-01');
    assert.equal(addMonths('2026-12-01', 1), '2027-01-01');
    assert.equal(addMonths('2026-01-01', -1), '2025-12-01');
    assert.equal(addMonths('2026-10-01', 12), '2027-10-01');
    assert.equal(shiftMonth('2026-12-15', 1), '2027-01-01');
  });

  it('lista los 12 períodos de un año', () => {
    const periods = periodsOfYear(2027);
    assert.equal(periods.length, 12);
    assert.equal(periods[0], '2027-01-01');
    assert.equal(periods[11], '2027-12-01');
  });
});
