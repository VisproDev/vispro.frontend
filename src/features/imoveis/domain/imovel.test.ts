import { describe, expect, it } from 'vitest';
import { validarEndereco, validarMetragem, validarNumeroComodos, validarTipo } from './imovel';

describe('imovel (domain)', () => {
  describe('validarEndereco', () => {
    it('rejeita endereço vazio ou só com espaços', () => {
      expect(validarEndereco("")).toBe(false);
      expect(validarEndereco("   ")).toBe(false);
    });

    it('aceita endereço preenchido', () => {
      expect(validarEndereco("Rua das Flores, 123")).toBe(true);
    });
  });

  describe('validarTipo', () => {
    it('rejeita tipo vazio', () => {
      expect(validarTipo("")).toBe(false);
    });

    it('aceita tipo selecionado', () => {
      expect(validarTipo("Apartamento")).toBe(true);
    });
  });

  describe('validarMetragem', () => {
    it('rejeita zero, negativos e valores não numéricos', () => {
      expect(validarMetragem(0)).toBe(false);
      expect(validarMetragem(-10)).toBe(false);
      expect(validarMetragem(Number.NaN)).toBe(false);
    });

    it('aceita metragem maior que zero', () => {
      expect(validarMetragem(75.5)).toBe(true);
    });
  });

  describe('validarNumeroComodos', () => {
    it('rejeita zero, negativos e valores não inteiros', () => {
      expect(validarNumeroComodos(0)).toBe(false);
      expect(validarNumeroComodos(-1)).toBe(false);
      expect(validarNumeroComodos(2.5)).toBe(false);
    });

    it('aceita número de cômodos inteiro maior que zero', () => {
      expect(validarNumeroComodos(4)).toBe(true);
    });
  });
});
