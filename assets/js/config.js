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
      'Olá, Dr. Álvaro Marcelo! Conheci seu trabalho pelo site e gostaria de obter informações sobre uma avaliação de estética facial e os horários disponíveis.',
  },
  instagram: {
    usuario: 'dr.alvaromarcelopr',
    url: 'https://www.instagram.com/dr.alvaromarcelopr/',
  },
  pagamento: ['crédito', 'débito', 'Pix', 'dinheiro'],
  regiao: 'São Paulo/SP',
  // Pendentes de confirmação pelo profissional:
  endereco: 'Avenida Conselheiro Carrão, 284 — Sala 405, Chácara Califórnia, São Paulo/SP',
  // Google Maps (incorporação oficial, sem chave de API) e link de rota
  mapaEmbedUrl:
    'https://www.google.com/maps?q=Avenida%20Conselheiro%20Carr%C3%A3o%2C%20284%2C%20Ch%C3%A1cara%20Calif%C3%B3rnia%2C%20S%C3%A3o%20Paulo%20-%20SP&output=embed&hl=pt-BR&z=17',
  mapaRotaUrl:
    'https://www.google.com/maps/dir/?api=1&destination=Avenida%20Conselheiro%20Carr%C3%A3o%2C%20284%2C%20Ch%C3%A1cara%20Calif%C3%B3rnia%2C%20S%C3%A3o%20Paulo%20-%20SP',
  horarios: null, // ex.: 'Segunda a sexta, 9h às 19h'
};

export function whatsappUrl(mensagem = SITE.whatsapp.mensagem) {
  return `https://wa.me/${SITE.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;
}
