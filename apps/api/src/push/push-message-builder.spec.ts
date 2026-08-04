import {
  buildCashExpenseBody,
  buildCashInBody,
  buildCashOutBody,
  buildCashTransferBody,
  formatPushMoney,
  resolveActorDisplayName,
} from './push-message-builder';

describe('push-message-builder', () => {
  it('formats money with two decimals including .00', () => {
    expect(formatPushMoney('250')).toBe('250.00');
    expect(formatPushMoney(80.5)).toBe('80.50');
    expect(formatPushMoney('42.00')).toBe('42.00');
  });

  it('prefers fullName over username', () => {
    expect(
      resolveActorDisplayName({ fullName: 'Murad', username: 'murad' }),
    ).toBe('Murad');
    expect(resolveActorDisplayName({ fullName: '  ', username: 'murad' })).toBe(
      'murad',
    );
  });

  it('builds cash bodies without notes or ids', () => {
    expect(
      buildCashInBody({
        actorName: 'Murad',
        amount: '250',
        accountName: 'Əsas kassa',
      }),
    ).toBe('Murad — Kassa mədaxili: 250.00 AZN · Əsas kassa');

    expect(
      buildCashOutBody({
        actorName: 'Murad',
        amount: 80.5,
        accountName: 'Əsas kassa',
      }),
    ).toBe('Murad — Kassa məxarici: 80.50 AZN · Əsas kassa');

    expect(
      buildCashExpenseBody({
        actorName: 'Murad',
        amount: '42.00',
        accountName: 'Ofis kassası',
      }),
    ).toBe('Murad — Kassa xərci: 42.00 AZN · Ofis kassası');

    expect(
      buildCashTransferBody({
        actorName: 'Murad',
        amount: 500,
        sourceAccountName: 'Əsas kassa',
        destinationAccountName: 'Mağaza kassası',
      }),
    ).toBe('Murad — Transfer: 500.00 AZN · Əsas kassa → Mağaza kassası');
  });
});
