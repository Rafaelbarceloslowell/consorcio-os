export type R2DialogueMoment =
  | "first_login"
  | "welcome"
  | "working"
  | "success"


type R2DialogueProps = {
  name: string
  moment: R2DialogueMoment
}


export function getR2Dialogue({
  name,
  moment,
}: R2DialogueProps) {


  switch(moment) {


    case "first_login":

      return `
Olá, ${name}.

Eu sou o R2.

Bem-vindo ao GorilaOS.

Estou aqui para ajudar você
a encontrar oportunidades,
acompanhar seus clientes
e vender mais.
      `



    case "welcome":

      return `
Bom te ver novamente, ${name}.

Vamos começar?
      `



    case "working":

      return `
${name}, encontrei algumas
oportunidades para analisarmos.
      `



    case "success":

      return `
Excelente trabalho, ${name}.

Mais um resultado conquistado.
      `



    default:

      return `
Olá, ${name}.
      `
  }

}