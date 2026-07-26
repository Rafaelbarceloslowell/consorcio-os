import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UIKitPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-12">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Gorila OS UI Kit
          </h1>

          <p className="mt-2 text-slate-600">
            Playground oficial do Design System.
          </p>
        </div>

        {/* Buttons */}

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Buttons</h2>

          <div className="flex flex-wrap gap-4">
            <Button>Primary</Button>

            <Button variant="secondary">
              Secondary
            </Button>

            <Button variant="outline">
              Outline
            </Button>

            <Button variant="ghost">
              Ghost
            </Button>

            <Button variant="danger">
              Danger
            </Button>

            <Button loading loadingText="Salvando..." />
          </div>
        </section>

        {/* Inputs */}

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Inputs</h2>

          <div className="grid max-w-xl gap-4">
            <Input placeholder="Nome do cliente" />

            <Input
              placeholder="Pesquisar..."
              loading
            />

            <Input
              placeholder="Campo obrigatório"
              errorMessage="Este campo é obrigatório."
            />
          </div>
        </section>

        {/* Cards */}

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Cards</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card hover>
              <CardHeader>
                <div>
                  <CardTitle>Clientes</CardTitle>

                  <CardDescription>
                    Total cadastrados
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-5xl font-bold">
                  1.245
                </p>
              </CardContent>
            </Card>

            <Card hover>
              <CardHeader>
                <div>
                  <CardTitle>Vendas</CardTitle>

                  <CardDescription>
                    Este mês
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-5xl font-bold">
                  R$ 2,8 mi
                </p>
              </CardContent>
            </Card>

            <Card glass hover>
              <CardHeader>
                <div>
                  <CardTitle>Conversão</CardTitle>

                  <CardDescription>
                    Últimos 30 dias
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-5xl font-bold">
                  31%
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
