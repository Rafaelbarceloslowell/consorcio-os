import {
    describe,
    expect,
    it,
  } from "vitest"
  
  import {
    cn,
  } from "./utils"
  
  describe(
    "cn",
    () => {
      it(
        "deve combinar classes simples",
        () => {
          expect(
            cn(
              "flex",
              "items-center",
            ),
          ).toBe(
            "flex items-center",
          )
        },
      )
  
      it(
        "deve ignorar valores falsos",
        () => {
          expect(
            cn(
              "flex",
              false,
              null,
              undefined,
              "",
              "items-center",
            ),
          ).toBe(
            "flex items-center",
          )
        },
      )
  
      it(
        "deve aplicar classes condicionais",
        () => {
          const isActive = true
          const isDisabled = false
  
          expect(
            cn({
              "bg-blue-500":
                isActive,
              "opacity-50":
                isDisabled,
            }),
          ).toBe(
            "bg-blue-500",
          )
        },
      )
  
      it(
        "deve aceitar arrays de classes",
        () => {
          expect(
            cn([
              "flex",
              "gap-2",
            ]),
          ).toBe(
            "flex gap-2",
          )
        },
      )
  
      it(
        "deve resolver conflitos de classes Tailwind",
        () => {
          expect(
            cn(
              "p-2",
              "p-4",
            ),
          ).toBe(
            "p-4",
          )
        },
      )
  
      it(
        "deve manter classes Tailwind que não entram em conflito",
        () => {
          expect(
            cn(
              "px-4",
              "py-2",
            ),
          ).toBe(
            "px-4 py-2",
          )
        },
      )
  
      it(
        "deve preservar a última classe de cor conflitante",
        () => {
          expect(
            cn(
              "text-red-500",
              "text-blue-500",
            ),
          ).toBe(
            "text-blue-500",
          )
        },
      )
  
      it(
        "deve combinar strings, arrays e objetos",
        () => {
          expect(
            cn(
              "flex",
              [
                "items-center",
                "gap-2",
              ],
              {
                "font-bold": true,
                hidden: false,
              },
            ),
          ).toBe(
            "flex items-center gap-2 font-bold",
          )
        },
      )
  
      it(
        "deve retornar uma string vazia quando não receber classes",
        () => {
          expect(
            cn(),
          ).toBe("")
        },
      )
    },
  )