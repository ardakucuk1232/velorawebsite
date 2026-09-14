import type { FormEvent } from 'react';
import { z } from 'zod';

const namePattern = /^[\p{L}\p{M}]+(?:[ '’-][\p{L}\p{M}]+)*$/u;

const emailSchema = z.string().trim().max(254).email();

export function isValidName(value: string): boolean {
    const name = value.trim();

    return name.length >= 3 && name.length <= 100 && namePattern.test(name);
}

export function isValidEmail(value: string): boolean {
    return emailSchema.safeParse(value).success;
}

export function handleNameInput(event: FormEvent<HTMLInputElement>): void {
    const input = event.currentTarget;

    input.value = input.value.replace(/[^\p{L}\p{M} '’-]/gu, '');

    input.setCustomValidity(
        input.value && !isValidName(input.value) ? 'Ad soyad en az 3 karakter olmalı ve yalnızca harf içermelidir.'
        : '',
    );
}

export function handleEmailInput(event: FormEvent<HTMLInputElement>): void {
    const input = event.currentTarget;
    const value = input.value.trim();
    const cursor = input.selectionStart;

    input.value = input.value.replace(/[^a-zA-Z0-9@._+-]/g, '');

    input.setCustomValidity(
        input.value && !isValidEmail(input.value) ? 'Geçerli bir e-posta adresi giriniz.'
        : '',
    );
}