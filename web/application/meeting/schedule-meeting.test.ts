import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    MockCrmRepository,
  } from "@/repositories/crm/mock-crm-repository"
  
  import {
    scheduleMeeting,
  } from "./schedule-meeting"
  
  function createRepository() {
    return new MockCrmRepository()
  }
  
  describe("scheduleMeeting", () => {
    it(
      "agenda uma reunião online para um lead",
      () => {
        const crmRepository =
          createRepository()
  
        const result = scheduleMeeting(
          {
            title:
              "Apresentação da proposta",
            description:
              "Apresentar a estratégia de consórcio.",
            type: "online",
            startAt:
              "2026-07-25T14:00:00.000Z",
            endAt:
              "2026-07-25T15:00:00.000Z",
            consultantId:
              "consultant-1",
            leadId: "lead-2",
            meetingUrl:
              "https://meet.google.com/test-meeting",
            notes:
              "Confirmar presença no dia anterior.",
          },
          {
            crmRepository,
            now: new Date(
              "2026-07-21T23:30:00.000Z",
            ),
            generateId: () =>
              "meeting-created",
          },
        )
  
        expect(result.id).toBe(
          "meeting-created",
        )
  
        expect(result.status).toBe(
          "scheduled",
        )
  
        expect(result.type).toBe(
          "online",
        )
  
        expect(result.leadId).toBe(
          "lead-2",
        )
  
        expect(result.clientId).toBe(
          undefined,
        )
  
        expect(
          result.consultantId,
        ).toBe(
          "consultant-1",
        )
  
        expect(
          result.meetingUrl,
        ).toBe(
          "https://meet.google.com/test-meeting",
        )
  
        expect(result.createdAt).toBe(
          "2026-07-21T23:30:00.000Z",
        )
      },
    )
  
    it(
      "agenda uma reunião presencial para um cliente",
      () => {
        const crmRepository =
          createRepository()
  
        const result = scheduleMeeting(
          {
            title:
              "Reunião de pós-venda",
            type: "in_person",
            startAt:
              "2026-07-26T16:00:00.000Z",
            endAt:
              "2026-07-26T17:00:00.000Z",
            consultantId:
              "consultant-1",
            clientId: "client-1",
            location:
              "Escritório ConsórcioOS",
          },
          {
            crmRepository,
            generateId: () =>
              "meeting-client",
          },
        )
  
        expect(result.clientId).toBe(
          "client-1",
        )
  
        expect(result.leadId).toBe(
          undefined,
        )
  
        expect(result.location).toBe(
          "Escritório ConsórcioOS",
        )
      },
    )
  
    it(
      "persiste a reunião criada",
      () => {
        const crmRepository =
          createRepository()
  
        scheduleMeeting(
          {
            title:
              "Reunião persistida",
            type: "phone",
            startAt:
              "2026-07-27T12:00:00.000Z",
            endAt:
              "2026-07-27T12:30:00.000Z",
            consultantId:
              "consultant-1",
            leadId: "lead-1",
          },
          {
            crmRepository,
            generateId: () =>
              "meeting-persisted",
          },
        )
  
        const persistedMeeting =
          crmRepository.getMeetingById(
            "meeting-persisted",
          )
  
        expect(
          persistedMeeting?.title,
        ).toBe(
          "Reunião persistida",
        )
  
        expect(
          persistedMeeting?.leadId,
        ).toBe(
          "lead-1",
        )
      },
    )
  
    it(
      "não agenda reunião sem lead ou cliente",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Reunião sem participante",
              type: "phone",
              startAt:
                "2026-07-27T14:00:00.000Z",
              endAt:
                "2026-07-27T14:30:00.000Z",
              consultantId:
                "consultant-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "A reunião precisa estar vinculada a um lead ou cliente.",
        )
      },
    )
  
    it(
      "não agenda reunião com lead e cliente simultaneamente",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Reunião inválida",
              type: "phone",
              startAt:
                "2026-07-27T15:00:00.000Z",
              endAt:
                "2026-07-27T15:30:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-1",
              clientId: "client-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "A reunião não pode estar vinculada simultaneamente a um lead e a um cliente.",
        )
      },
    )
  
    it(
      "exige link para reunião online",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Reunião online",
              type: "online",
              startAt:
                "2026-07-27T16:00:00.000Z",
              endAt:
                "2026-07-27T16:30:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "O link da reunião é obrigatório para reuniões online.",
        )
      },
    )
  
    it(
      "exige local para reunião presencial",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Reunião presencial",
              type: "in_person",
              startAt:
                "2026-07-27T17:00:00.000Z",
              endAt:
                "2026-07-27T17:30:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "O local é obrigatório para reuniões presenciais.",
        )
      },
    )
  
    it(
      "não aceita término anterior ao início",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Horário inválido",
              type: "phone",
              startAt:
                "2026-07-27T18:00:00.000Z",
              endAt:
                "2026-07-27T17:30:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          "O término da reunião deve ocorrer depois do início.",
        )
      },
    )
  
    it(
      "não agenda reunião para consultor inexistente",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Consultor inexistente",
              type: "phone",
              startAt:
                "2026-07-27T18:00:00.000Z",
              endAt:
                "2026-07-27T18:30:00.000Z",
              consultantId:
                "consultant-inexistente",
              leadId: "lead-1",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'Consultor não encontrado para o ID "consultant-inexistente".',
        )
      },
    )
  
    it(
      "não agenda reunião com lead de outro consultor",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Lead de outro consultor",
              type: "phone",
              startAt:
                "2026-07-27T19:00:00.000Z",
              endAt:
                "2026-07-27T19:30:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-3",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'O lead "lead-3" não pertence ao consultor "consultant-1".',
        )
      },
    )
  
    it(
      "não agenda reunião para lead perdido",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Lead perdido",
              type: "phone",
              startAt:
                "2026-07-27T20:00:00.000Z",
              endAt:
                "2026-07-27T20:30:00.000Z",
              consultantId:
                "consultant-2",
              leadId: "lead-6",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'O lead "lead-6" está perdido e não pode receber novas reuniões.',
        )
      },
    )
  
    it(
      "não permite conflito de horário para o consultor",
      () => {
        const crmRepository =
          createRepository()
  
        expect(() =>
          scheduleMeeting(
            {
              title:
                "Reunião conflitante",
              type: "phone",
              startAt:
                "2026-07-20T14:45:00.000Z",
              endAt:
                "2026-07-20T15:15:00.000Z",
              consultantId:
                "consultant-1",
              leadId: "lead-2",
            },
            {
              crmRepository,
            },
          ),
        ).toThrowError(
          'O consultor "consultant-1" já possui uma reunião no horário informado.',
        )
      },
    )
  })