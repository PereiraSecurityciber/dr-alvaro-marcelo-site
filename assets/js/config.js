/*
 * Configuração central do site — altere aqui número, mensagem e dados pendentes.
 * Campos com valor null são exibidos como "em confirmação" e não geram mapa/endereço.
 */
export const SITE = {
  nome: 'Dr. Álvaro Marcelo',
  cro: 'CRO-SP 139591',
  whatsapp: {
    numero: '5511982417600',
    exibicao: '+55 11 98241-7600',
    mensagem:
      'Olá, Dr. Álvaro Marcelo! Conheci seu trabalho pelo site e gostaria de obter informações sobre uma avaliação odontológica e os horários disponíveis.',
  },
  instagram: {
    usuario: 'dr.alvaromarcelopr',
    url: 'https://www.instagram.com/dr.alvaromarcelopr/',
  },
  pagamento: ['crédito', 'débito', 'Pix', 'dinheiro'],
  regiao: 'Tatuapé · São Paulo/SP', // conforme bio do Instagram
  // Pendentes de confirmação pelo profissional:
  endereco: null, // ex.: 'Rua Exemplo, 123 — Bairro, Cidade/SP'
  mapaEmbedUrl: null, // URL de incorporação do Google Maps
  horarios: null, // ex.: 'Segunda a sexta, 9h às 19h'
};

export function whatsappUrl(mensagem = SITE.whatsapp.mensagem) {
  return `https://wa.me/${SITE.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;
}
