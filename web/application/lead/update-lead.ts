import type {
    ConsortiumType,
    Lead,
    LeadSource,
  } from "@/types/domain"
  
  import type {
    CrmRepository,
  } from "@/repositories/crm/crm-repository"
  
  export type UpdateLeadInput = {
    leadId: string
    name?: string
    email?: string
    phone?: string
    document?: string
    companyName?: string
    source?: LeadSource
    consortiumType?: ConsortiumType
    desiredCreditValue?: number
    desiredTermMonths?: number
    consultantId?: string
    notes?: string
  }
  
  export type UpdateLeadOutput = {
    lead: Lead
  }
  
  export type UpdateLeadOptions = {
    now?: Date
  }
  
  function normalizeEmail(
    email: string,
  ): string {
    return email
      .trim()
      .toLowerCase()
  }
  
  function normalizePhone(
    phone: string,
  ): string {
    return phone.replace(
      /\D/g,
      "",
    )
  }
  
  function validateEmail(
    email: string,
  ): void {
    if (!email.trim()) {
      throw new Error(
        "O e-mail do lead é obrigatório.",
      )
    }
  
    if (!email.includes("@")) {
      throw new Error(
        "O e-mail informado é inválido.",
      )
    }
  }
  
  function validatePhone(
    phone: string,
  ): void {
    if (!normalizePhone(phone)) {
      throw new Error(
        "O telefone do lead é obrigatório.",
      )
    }
  }
  
  function validateDesiredCreditValue(
    desiredCreditValue: number,
  ): void {
    if (
      !Number.isFinite(
        desiredCreditValue,
      ) ||
      desiredCreditValue <= 0
    ) {
      throw new Error(
        "O valor de crédito desejado deve ser maior que zero.",
      )
    }
  }
  
  function validateDesiredTermMonths(
    desiredTermMonths: number,
  ): void {
    if (
      !Number.isInteger(
        desiredTermMonths,
      ) ||
      desiredTermMonths <= 0
    ) {
      throw new Error(
        "O prazo desejado deve ser um número inteiro maior que zero.",
      )
    }
  }
  
  export class UpdateLead {
    constructor(
      private readonly crmRepository: CrmRepository,
      private readonly options: UpdateLeadOptions = {},
    ) {}
  
    execute(
      input: UpdateLeadInput,
    ): UpdateLeadOutput {
      const leadId =
        input.leadId.trim()
  
      if (!leadId) {
        throw new Error(
          "O ID do lead é obrigatório.",
        )
      }
  
      const currentLead =
        this.crmRepository
          .getLeadById(
            leadId,
          )
  
      if (!currentLead) {
        throw new Error(
          `Lead não encontrado para o ID "${leadId}".`,
        )
      }
  
      const name =
        input.name !== undefined
          ? input.name.trim()
          : currentLead.name
  
      if (!name) {
        throw new Error(
          "O nome do lead é obrigatório.",
        )
      }
  
      const email =
        input.email !== undefined
          ? input.email
          : currentLead.email
  
      validateEmail(
        email,
      )
  
      const normalizedEmail =
        normalizeEmail(
          email,
        )
  
      const phone =
        input.phone !== undefined
          ? input.phone
          : currentLead.phone
  
      validatePhone(
        phone,
      )
  
      const normalizedPhone =
        normalizePhone(
          phone,
        )
  
      const consultantId =
        input.consultantId !== undefined
          ? input.consultantId.trim()
          : currentLead.consultantId
  
      if (!consultantId) {
        throw new Error(
          "O consultor é obrigatório para atualizar o lead.",
        )
      }
  
      const consultant =
        this.crmRepository
          .getConsultantById(
            consultantId,
          )
  
      if (!consultant) {
        throw new Error(
          `Consultor não encontrado para o ID "${consultantId}".`,
        )
      }
  
      const desiredCreditValue =
        input.desiredCreditValue ??
        currentLead.desiredCreditValue
  
      validateDesiredCreditValue(
        desiredCreditValue,
      )
  
      const desiredTermMonths =
        input.desiredTermMonths ??
        currentLead.desiredTermMonths
  
      validateDesiredTermMonths(
        desiredTermMonths,
      )
  
      const otherLeads =
        this.crmRepository
          .getLeads()
          .filter(
            (lead) =>
              lead.id !==
              currentLead.id,
          )
  
      const duplicatedEmail =
        otherLeads.some(
          (lead) =>
            normalizeEmail(
              lead.email,
            ) === normalizedEmail,
        )
  
      if (duplicatedEmail) {
        throw new Error(
          `Já existe um lead cadastrado com o e-mail "${normalizedEmail}".`,
        )
      }
  
      const duplicatedPhone =
        otherLeads.some(
          (lead) =>
            normalizePhone(
              lead.phone,
            ) === normalizedPhone,
        )
  
      if (duplicatedPhone) {
        throw new Error(
          "Já existe um lead cadastrado com o telefone informado.",
        )
      }
  
      const updatedLead: Lead = {
        ...currentLead,
  
        name,
  
        email:
          normalizedEmail,
  
        phone:
          input.phone !== undefined
            ? input.phone.trim()
            : currentLead.phone,
  
        document:
          input.document !== undefined
            ? input.document.trim() ||
              undefined
            : currentLead.document,
  
        companyName:
          input.companyName !== undefined
            ? input.companyName.trim() ||
              undefined
            : currentLead.companyName,
  
        source:
          input.source ??
          currentLead.source,
  
        consortiumType:
          input.consortiumType ??
          currentLead.consortiumType,
  
        desiredCreditValue,
  
        desiredTermMonths,
  
        consultantId,
  
        notes:
          input.notes !== undefined
            ? input.notes.trim() ||
              undefined
            : currentLead.notes,
  
        updatedAt:
          (
            this.options.now ??
            new Date()
          ).toISOString(),
      }
  
      const savedLead =
        this.crmRepository
          .updateLead(
            updatedLead,
          )
  
      return {
        lead: savedLead,
      }
    }
  }