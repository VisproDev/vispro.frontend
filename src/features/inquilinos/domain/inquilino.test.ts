import { describe, expect, it } from 'vitest';
import { cursorAposDigito, formatarDocumento, normalizarDocumento, validarDocumento, validarEmail } from './inquilino';

describe('inquilino (domain)', () => {
  describe('normalizarDocumento', () => {
    it('remove máscara e caracteres não numéricos', () => {
      expect(normalizarDocumento("123.456.789-09")).toBe("12345678909");
      expect(normalizarDocumento("12.345.678/0001-95")).toBe("12345678000195");
    });
  });

  describe('formatarDocumento', () => {
    it('aplica máscara de CPF para 11 dígitos', () => {
      expect(formatarDocumento("12345678909")).toBe("123.456.789-09");
    });

    it('aplica máscara de CNPJ para 14 dígitos', () => {
      expect(formatarDocumento("12345678000195")).toBe("12.345.678/0001-95");
    });

    it('formata progressivamente enquanto o usuário digita', () => {
      expect(formatarDocumento("123")).toBe("123");
      expect(formatarDocumento("1234")).toBe("123.4");
      expect(formatarDocumento("123456789")).toBe("123.456.789");
    });
  });

  describe('validarDocumento', () => {
    it('aceita CPF válido, com ou sem máscara', () => {
      expect(validarDocumento("12345678909")).toBe(true);
      expect(validarDocumento("123.456.789-09")).toBe(true);
    });

    it('aceita CNPJ válido, com ou sem máscara', () => {
      expect(validarDocumento("11222333000181")).toBe(true);
      expect(validarDocumento("11.222.333/0001-81")).toBe(true);
    });

    it('rejeita CPF com checksum inválido', () => {
      expect(validarDocumento("12345678900")).toBe(false);
    });

    it('rejeita CNPJ com checksum inválido', () => {
      expect(validarDocumento("11222333000100")).toBe(false);
    });

    it('rejeita sequências de dígitos repetidos', () => {
      expect(validarDocumento("11111111111")).toBe(false);
      expect(validarDocumento("11111111111111")).toBe(false);
    });

    it('rejeita tamanhos diferentes de 11 ou 14 dígitos', () => {
      expect(validarDocumento("123")).toBe(false);
      expect(validarDocumento("")).toBe(false);
    });
  });

  describe('validarEmail', () => {
    it('aceita vazio (campo opcional)', () => {
      expect(validarEmail("")).toBe(true);
      expect(validarEmail("   ")).toBe(true);
    });

    it('aceita email com formato válido', () => {
      expect(validarEmail("contato@empresa.com")).toBe(true);
    });

    it('rejeita email sem @ ou sem domínio', () => {
      expect(validarEmail("contato")).toBe(false);
      expect(validarEmail("contato@")).toBe(false);
      expect(validarEmail("contato@empresa")).toBe(false);
    });
  });

  describe('cursorAposDigito', () => {
    it('retorna 0 quando não há dígitos antes do cursor', () => {
      expect(cursorAposDigito("123.456.789-09", 0)).toBe(0);
    });

    it('pula os separadores da máscara ao localizar o n-ésimo dígito', () => {
      expect(cursorAposDigito("123.456.789-09", 3)).toBe(3);
      expect(cursorAposDigito("123.456.789-09", 4)).toBe(5);
      expect(cursorAposDigito("123.456.789-09", 11)).toBe(14);
    });
  });
});