import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  allowedOrigin,
  amountsMatch,
  mapPaymentStatus,
  periodOf,
  resolvePeriod,
  signatureManifest,
  verifySignature,
} from './mercadopago.ts';

describe('mapPaymentStatus', () => {
  it('traduce los estados finales', () => {
    assert.equal(mapPaymentStatus('approved'), 'approved');
    assert.equal(mapPaymentStatus('rejected'), 'rejected');
    assert.equal(mapPaymentStatus('cancelled'), 'rejected');
    assert.equal(mapPaymentStatus('refunded'), 'refunded');
    assert.equal(mapPaymentStatus('charged_back'), 'refunded');
  });

  it('deja como pendiente todo lo que no está resuelto o no se conoce', () => {
    for (const status of ['pending', 'in_process', 'authorized', 'in_mediation', 'algo_nuevo', undefined]) {
      assert.equal(mapPaymentStatus(status), 'pending');
    }
  });
});

describe('amountsMatch', () => {
  it('compara pesos sin errores de decimales', () => {
    assert.equal(amountsMatch(25000, '25000.00'), true);
    assert.equal(amountsMatch(0.1 + 0.2, 0.3), true);
    assert.equal(amountsMatch(25000, 24999.99), false);
  });
});

describe('periodOf', () => {
  it('usa el mes de Buenos Aires, no el de UTC', () => {
    // 1/11 01:00 UTC todavía es 31/10 22:00 en Argentina.
    assert.equal(periodOf(new Date('2026-11-01T01:00:00Z')), '2026-10-01');
    assert.equal(periodOf(new Date('2026-11-01T03:00:00Z')), '2026-11-01');
    assert.equal(periodOf(new Date('2026-10-15T12:00:00Z')), '2026-10-01');
  });
});

describe('resolvePeriod', () => {
  const now = new Date('2026-10-29T15:00:00Z');

  it('sin dato usa el mes actual', () => {
    assert.equal(resolvePeriod(undefined, now), '2026-10-01');
    assert.equal(resolvePeriod('', now), '2026-10-01');
  });

  it('acepta el mes actual y hasta 12 meses adelante, con o sin día', () => {
    assert.equal(resolvePeriod('2026-10', now), '2026-10-01');
    assert.equal(resolvePeriod('2026-12-01', now), '2026-12-01');
    assert.equal(resolvePeriod('2027-01', now), '2027-01-01');
    assert.equal(resolvePeriod('2027-10', now), '2027-10-01');
  });

  it('rechaza meses pasados, muy lejanos o mal escritos', () => {
    for (const value of ['2026-09', '2025-12-01', '2027-11', '2026-13', '2026-00', '2026-10-15', 'octubre', 20261001, {}]) {
      assert.equal(resolvePeriod(value, now), null, String(value));
    }
  });
});

describe('allowedOrigin', () => {
  const allowed = ['https://sitio.example', 'http://localhost:5173'];
  it('acepta solo los orígenes de la lista', () => {
    assert.equal(allowedOrigin('http://localhost:5173', allowed), 'http://localhost:5173');
    assert.equal(allowedOrigin('https://malicioso.example', allowed), null);
    assert.equal(allowedOrigin(null, allowed), null);
  });

  it('acepta los previews del proyecto pero no los de otro', () => {
    const rules = [/^https:\/\/programacion-web-[a-z0-9-]+-patsy\.vercel\.app$/];
    assert.equal(
      allowedOrigin('https://programacion-web-git-rama-patsy.vercel.app', rules),
      'https://programacion-web-git-rama-patsy.vercel.app',
    );
    assert.equal(allowedOrigin('https://programacion-web-git-rama-otro.vercel.app', rules), null);
    assert.equal(allowedOrigin('https://evil.com/programacion-web-x-patsy.vercel.app', rules), null);
  });
});

describe('verifySignature', () => {
  const secret = 'secreto-de-prueba';
  const sign = (manifest: string) => createHmac('sha256', secret).update(manifest).digest('hex');

  it('arma el texto firmado omitiendo las partes que faltan', () => {
    assert.equal(signatureManifest({ dataId: 'ABC123', requestId: 'req-1', ts: '1700' }), 'id:abc123;request-id:req-1;ts:1700;');
    assert.equal(signatureManifest({ ts: '1700' }), 'ts:1700;');
  });

  it('acepta una firma válida', async () => {
    const v1 = sign('id:123;request-id:req-1;ts:1700;');
    assert.equal(
      await verifySignature({ secret, signatureHeader: `ts=1700,v1=${v1}`, requestId: 'req-1', dataId: '123' }),
      true,
    );
  });

  it('rechaza una firma con otro id, otro secreto o mal formada', async () => {
    const v1 = sign('id:123;request-id:req-1;ts:1700;');
    const header = `ts=1700,v1=${v1}`;
    assert.equal(await verifySignature({ secret, signatureHeader: header, requestId: 'req-1', dataId: '999' }), false);
    assert.equal(await verifySignature({ secret: 'otro', signatureHeader: header, requestId: 'req-1', dataId: '123' }), false);
    assert.equal(await verifySignature({ secret, signatureHeader: 'basura', requestId: 'req-1', dataId: '123' }), false);
    assert.equal(await verifySignature({ secret, signatureHeader: null, requestId: 'req-1', dataId: '123' }), false);
  });
});
