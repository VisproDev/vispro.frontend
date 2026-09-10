import { describe, expect, it } from 'vitest';
import { formatarDocumento, normalizarDocumento, validarDocumento } from './proprietario';

describe('proprietario (domain)', () => {
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
});
