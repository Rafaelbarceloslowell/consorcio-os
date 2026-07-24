import type {
    Address,
    PersonType,
  } from "@/types/domain"
  
  import {
    normalizeDocument,
    normalizeEmail,
    normalizePhone,
    normalizeZipCode,
  } from "./client-normalizer"
  
  export type ClientValidationInput = {
    type: PersonType
    name: string
    email: string
    phone: string
    phoneCountryCode?: string
    document: string
    address: Address
    consultantId: string
    birthDate?: string
    companyName?: string
  }
  
  export function isValidEmail(
    email: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  }
  
  export function isValidInternationalPhone(
    phone: string,
  ): boolean {
    return /^\+[1-9]\d{7,14}$/.test(
      phone,
    )
  }
  
  export function validateDocument(
    type: PersonType,
    document: string,
  ): void {
    const normalizedDocument =
      normalizeDocument(
        document,
      )
  
    if (!normalizedDocument) {
      throw new Error(
        "O documento do cliente é obrigatório.",
      )
    }
  
    if (
      type === "individual" &&
      normalizedDocument.length !== 11
    ) {
      throw new Error(
        "O CPF do cliente deve possuir 11 dígitos.",
      )
    }
  
    if (
      type === "company" &&
      normalizedDocument.length !== 14
    ) {
      throw new Error(
        "O CNPJ do cliente deve possuir 14 dígitos.",
      )
    }
  }
  
  export function validateAddress(
    address: Address,
  ): void {
    if (!address.street.trim()) {
      throw new Error(
        "A rua do cliente é obrigatória.",
      )
    }
  
    if (!address.number.trim()) {
      throw new Error(
        "O número do endereço do cliente é obrigatório.",
      )
    }
  
    if (!address.neighborhood.trim()) {
      throw new Error(
        "O bairro do cliente é obrigatório.",
      )
    }
  
    if (!address.city.trim()) {
      throw new Error(
        "A cidade do cliente é obrigatória.",
      )
    }
  
    const state =
      address.state
        .trim()
        .toUpperCase()
  
    if (!state) {
      throw new Error(
        "O estado do cliente é obrigatório.",
      )
    }
  
    if (
      !/^[A-Z]{2}$/.test(
        state,
      )
    ) {
      throw new Error(
        "O estado do cliente deve ser informado com uma sigla de duas letras.",
      )
    }
  
    const normalizedZipCode =
      normalizeZipCode(
        address.zipCode,
      )
  
    if (!normalizedZipCode) {
      throw new Error(
        "O CEP do cliente é obrigatório.",
      )
    }
  
    if (
      normalizedZipCode.length !== 8
    ) {
      throw new Error(
        "O CEP do cliente deve possuir 8 dígitos.",
      )
    }
  }
  
  export function validateBirthDate(
    birthDate: string | undefined,
  ): void {
    if (!birthDate?.trim()) {
      return
    }
  
    const parsedDate =
      new Date(
        birthDate,
      )
  
    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      throw new Error(
        "A data de nascimento do cliente é inválida.",
      )
    }
  }
  
  export function validateClientInput(
    input: ClientValidationInput,
  ): void {
    if (!input.consultantId.trim()) {
      throw new Error(
        "O consultor é obrigatório para criar o cliente.",
      )
    }
  
    if (
      input.type === "company" &&
      !input.companyName?.trim()
    ) {
      throw new Error(
        "A razão social é obrigatória para clientes do tipo empresa.",
      )
    }
  
    if (
      input.type === "individual" &&
      !input.name.trim()
    ) {
      throw new Error(
        "O nome do cliente é obrigatório.",
      )
    }
  
    const normalizedEmail =
      normalizeEmail(
        input.email,
      )
  
    if (!normalizedEmail) {
      throw new Error(
        "O e-mail do cliente é obrigatório.",
      )
    }
  
    if (
      !isValidEmail(
        normalizedEmail,
      )
    ) {
      throw new Error(
        "O e-mail informado é inválido.",
      )
    }
  
    const normalizedPhone =
      normalizePhone(
        input.phone,
        input.phoneCountryCode,
      )
  
    if (!normalizedPhone) {
      throw new Error(
        "O telefone do cliente é obrigatório.",
      )
    }
  
    if (
      !isValidInternationalPhone(
        normalizedPhone,
      )
    ) {
      throw new Error(
        "O telefone internacional do cliente deve possuir entre 8 e 15 dígitos, incluindo o código do país.",
      )
    }
  
    validateDocument(
      input.type,
      input.document,
    )
  
    validateAddress(
      input.address,
    )
  
    validateBirthDate(
      input.birthDate,
    )
  }