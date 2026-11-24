import { NinjutsuType, StageId } from './types';

export interface CombatTipEntry {
  comboName: string;
  desktopSequence: string[];
  mobileSequence: string[];
  comboSummary: string;
  strategyTitle: string;
  strategyText: string;
  synergyTitle: string;
  synergyText: string;
}

export const NINJUTSU_COMBAT_TIPS: Record<NinjutsuType, CombatTipEntry[]> = {
  ikazuchi: [
    {
      comboName: 'Tempestade Inabalável',
      desktopSequence: ['E (Ikazuchi)', 'J', 'J', 'J', 'J (Finalizador)'],
      mobileSequence: ['Jutsu', 'Katana ×4'],
      comboSummary:
        'Ative o Escudo de Trovão antes de mergulhar no meio dos inimigos: os 3 bloqueios permitem fechar o combo de 4 golpes sem perder o multiplicador.',
      strategyTitle: 'Pressão Contra Super-Armadura',
      strategyText:
        'Onis e chefes resistem a cortes leves. Com Ikazuchi ativo, absorva o contra-ataque e continue golpeando para eletrocutar inimigos próximos e carregar Fúria da Lua.',
      synergyTitle: 'Defesa em Clima de Lua Carmesim',
      synergyText:
        'Sob Lua Carmesim inimigos ficam mais agressivos. Use o escudo de 3 cargas para manter Rank S de dano recebido e quebrar o selo elétrico de Kagerou.',
    },
    {
      comboName: 'Contra-Golpe Relâmpago',
      desktopSequence: ['Shift (Esquiva)', 'E (Ikazuchi)', 'K (Shuriken)', 'J ×3'],
      mobileSequence: ['Esquiva', 'Jutsu', 'Kunai', 'Katana ×3'],
      comboSummary:
        'Atravesse o ataque inimigo com Esquiva Sombria, dispare a descarga de Ikazuchi nas costas do alvo e conecte shuriken com sequência de katana.',
      strategyTitle: 'Controle de Multidão Seguro',
      strategyText:
        'A ativação inicial de Ikazuchi causa choque em área ao redor do shinobi — ideal quando cercado por Batedores Sombrios ou durante emboscadas.',
      synergyTitle: 'Preservação de Combo',
      synergyText:
        'Cada golpe absorvido pelo escudo impede que seu medidor de combo zere. Combine com ataques pesados para escalar rapidamente até o multiplicador máximo.',
    },
  ],
  karyu: [
    {
      comboName: 'Corte da Chama Perfurante',
      desktopSequence: ['J', 'J', 'Shift (Recuar)', 'E (Karyū)', 'K'],
      mobileSequence: ['Katana ×2', 'Esquiva', 'Jutsu', 'Kunai'],
      comboSummary:
        'Alinhe os inimigos no mesmo eixo horizontal, recue um passo com Esquiva Sombria e libere os Dragões de Fogo para atravessar toda a fila.',
      strategyTitle: 'Limpeza de Corredores e Selos',
      strategyText:
        'Karyū perfura múltiplos alvos em linha reta sem parar no primeiro inimigo. Excelente para derreter o escudo cibernético de Raiden e a couraça de Tetsujin.',
      synergyTitle: 'Abertura Contra Kunoichis',
      synergyText:
        'Dispare Karyū quando Kunoichis recuarem para atirar kunais à distância — o projétil de fogo cobre a arena inteira e interrompe ataques telegrafados.',
    },
    {
      comboName: 'Chuva de Brasas Aérea',
      desktopSequence: ['Espaço ×2', 'K (Leque Aéreo)', 'Aterrissar', 'E (Karyū)'],
      mobileSequence: ['Pular ×2', 'Kunai', 'Jutsu'],
      comboSummary:
        'Use o salto duplo Hassō-tobi com leque aéreo de shurikens para agrupar os oponentes e finalize com Dragões de Fogo assim que tocar o chão.',
      strategyTitle: 'Aproveitamento de Zonas de Perigo',
      strategyText:
        'Empurre inimigos em direção a poças elétricas ou lava e dispare Karyū à distância segura sem precisar atravessar o perigo ambiental.',
      synergyTitle: 'Precisão e Carga de Chi',
      synergyText:
        'Acertar 3 ou mais inimigos com um único Karyū dispara seu contador de combo de uma só vez e acelera a precisão média para Rank S.',
    },
  ],
  fushin: [
    {
      comboName: 'Tempestade Hassō-tobi',
      desktopSequence: ['E (Fushin)', 'Espaço ×2', 'K (Leque)', 'J (Corte Aéreo)'],
      mobileSequence: ['Jutsu', 'Pular ×2', 'Kunai', 'Katana'],
      comboSummary:
        'Com a velocidade e altura amplificadas de Fushin, encadeie saltos duplos lançando leques de shurikens no ar e desça cortando alvos isolados.',
      strategyTitle: 'Mobilidade Superior na Nevasca',
      strategyText:
        'Fushin compensa a redução de ritmo em tempestades de neve e permite cruzar zonas de fogo, eletricidade e quedas de escombros com sobra.',
      synergyTitle: 'Flanqueio Sem Sofrer Dano',
      synergyText:
        'Use a aceleração de Fushin para circular chefes lentos como Oni Guardião e Yuki, golpeando sempre pelas costas durante a recuperação deles.',
    },
    {
      comboName: 'Vento Cortante Contínuo',
      desktopSequence: ['E (Fushin)', 'J ×3', 'Shift (Esquiva)', 'J ×4'],
      mobileSequence: ['Jutsu', 'Katana ×3', 'Esquiva', 'Katana ×4'],
      comboSummary:
        'Cancele a recuperação do terceiro golpe com Esquiva Sombria para perseguir o alvo arremessado e estender o combo sem deixar a barra cair.',
      strategyTitle: 'Resgate Rápido de Civis',
      strategyText:
        'A velocidade extra facilita alcançar reféns antes que explosões ou inimigos os atinjam, garantindo Karma positivo e bônus no final da campanha.',
      synergyTitle: 'Controle de Plataformas Elevadas',
      synergyText:
        'Salte direto para telhados e passarelas altas para eliminar Kunoichis atiradoras antes que pressionem o chão da arena.',
    },
  ],
  mijin: [
    {
      comboName: 'Colapso da Lua Negra',
      desktopSequence: ['Atrair Grupo', 'Shift (Centro)', 'E (Mijin)', 'F (Fúria)'],
      mobileSequence: ['Esquiva', 'Jutsu', 'Fúria'],
      comboSummary:
        'Reúna a onda inteira ao seu redor, deslize para o centro com Esquiva Sombria e detone Mijin para causar dano massivo em 360° seguido de Fúria da Lua.',
      strategyTitle: 'Quebra Instantânea de Armaduras',
      strategyText:
        'Mijin possui o maior dano explosivo em área do arsenal. Guarde 100% de Chi para estilhaçar o selo de Kurogane e o Selo Final de Akuma.',
      synergyTitle: 'Atenção aos Civis Próximos',
      synergyText:
        'O raio da explosão sombria é amplo: resgate civis reféns primeiro ou afaste o combate antes de detonar Mijin para não perder Karma.',
    },
    {
      comboName: 'Emboscada Detonadora',
      desktopSequence: ['Névoa / Neve', 'Aproximar', 'E (Mijin)', 'J ×2'],
      mobileSequence: ['Aproximar', 'Jutsu', 'Katana ×2'],
      comboSummary:
        'Sob névoa densa ou nevasca, aproxime-se de inimigos em patrulha (?) sem alertá-los e abra o combate com Mijin aproveitando o bônus de Emboscada (+30%).',
      strategyTitle: 'Limpeza de Reforços de Chefe',
      strategyText:
        'Quando o chefe invocar lacaios na Fase II, espere eles se aproximarem do chefe e use Mijin para atingir todos simultaneamente.',
      synergyTitle: 'Ritmo de Recuperação de Chi',
      synergyText:
        'Logo após detonar Mijin, encaixe golpes rápidos de katana nos sobreviventes atordoados para reconstruir Chi rapidamente.',
    },
  ],
  bunshin: [
    {
      comboName: 'Pinça das Sombras',
      desktopSequence: ['E (Bunshin)', 'Shift (Flanco)', 'J ×4', 'K'],
      mobileSequence: ['Jutsu', 'Esquiva', 'Katana ×4', 'Kunai'],
      comboSummary:
        'Invoque 2 Clones das Sombras para travar a frente do inimigo, passe pelas costas com Esquiva Sombria e multiplique hits simultâneos no medidor de combo.',
      strategyTitle: 'Isca Tática em Baixa Visibilidade',
      strategyText:
        'Os clones atraem a detecção inimiga durante chuva, neve e névoa — permitindo que você escolha o momento exato para emboscar alvos perigosos.',
      synergyTitle: 'Pressão Constante em Chefes Ágeis',
      synergyText:
        'Contra Umigame e Tetsuo no Trem Blindado, os clones mantêm a barra de combo viva enquanto você desvia de investidas velozes.',
    },
    {
      comboName: 'Chuva Coordenada de Lâminas',
      desktopSequence: ['E (Bunshin)', 'Espaço ×2', 'K (Leque Aéreo)', 'J ×3'],
      mobileSequence: ['Jutsu', 'Pular ×2', 'Kunai', 'Katana ×3'],
      comboSummary:
        'Enquanto os clones atacam no solo e lançam shurikens, domine o espaço aéreo com Hassō-tobi para saturar a tela sem abrir guarda.',
      strategyTitle: 'Escalada Rápida de Rank de Combo',
      strategyText:
        'Os acertos dos Clones das Sombras somam ao seu contador de combo, facilitando atingir os tiers mais altos de dano bônus.',
      synergyTitle: 'Proteção de Flancos',
      synergyText:
        'Ative Bunshin logo ao entrar em ondas com múltiplos Ronins e Onis para evitar cercos pelos dois lados da tela.',
    },
  ],
  yagan: [
    {
      comboName: 'Caçador na Névoa',
      desktopSequence: ['E (Visão Noturna)', 'Shift', 'J ×4', 'K'],
      mobileSequence: ['Jutsu', 'Esquiva', 'Katana ×4', 'Kunai'],
      comboSummary:
        'Ative Visão Noturna para restaurar 100% de detecção, revelar ataques telegrafados e ganhar +20% de dano em todos os golpes durante 14 segundos.',
      strategyTitle: 'Domínio Sobre Névoa, Neve e Chuva',
      strategyText:
        'Visão Noturna perfura penalidades de visibilidade de qualquer clima aleatório e elimina a redução de dano à distância em fases de neblina densa.',
      synergyTitle: 'Alvos Prioritários Revelados',
      synergyText:
        'As marcações táticas expõem a barra de vida e o preparo de ataque de Hotaru e Enma mesmo do outro lado da arena.',
    },
    {
      comboName: 'Execução Furtiva Ampliada',
      desktopSequence: ['E (Visão Noturna)', 'Aproximar de (?)', 'J (Emboscada)', 'J ×3'],
      mobileSequence: ['Jutsu', 'Emboscada', 'Katana ×4'],
      comboSummary:
        'Use o alcance total da Visão Noturna para localizar inimigos em patrulha (?) ainda fora do raio de detecção deles e some +20% da visão com +30% de Emboscada.',
      strategyTitle: 'Precisão Cirúrgica com Shurikens',
      strategyText:
        'Na névoa densa, projéteis perdem força sem Visão Noturna. Com o jutsu ativo, abata Kunoichis distantes com dano amplificado.',
      synergyTitle: 'Economia de Vida para Rank S',
      synergyText:
        'Enxergar antecipadamente os sinais de golpe pesado e quedas de escombros evita dano surpresa e protege sua nota final da fase.',
    },
  ],
};

export const STAGE_HAZARD_BRIEFS: Record<StageId, string> = {
  village: 'Fogo nos templos e chuvas repentinas: atravesse chamas usando Esquiva Sombria.',
  bamboo: 'Neblina densa e brejos tóxicos: use Visão Noturna (6+E) para revelar alvos ocultos.',
  neon_city: 'Poças elétricas nos trilhos: pule ou use Esquiva Sombria para cruzar sem choque.',
  fortress: 'Laboratório eletrificado e desabamentos: observe sombras de impacto no solo.',
  harbor: 'Tempestades formam poças elétricas extras — atraia inimigos para o perigo.',
  mines: 'Queda frequente de escombros nas cavernas: os rochedos esmagam inimigos também.',
  snow_peak: 'Fissuras gélidas e nevascas cortam detecção: aproveite ataques de Emboscada (+30%).',
  temple_ruins: 'Neblina densa, fogo sagrado e desabamentos exigem leitura constante do terreno.',
  bullet_train: 'Corredor estreito sob tempestade: use saltos duplos e clones para controlar espaço.',
  eclipse_citadel: 'Chamas do Eclipse e chefão implacável: gerencie Chi para quebrar o Selo Final.',
};

export function getTipsForNinjutsu(kind: NinjutsuType): CombatTipEntry[] {
  return NINJUTSU_COMBAT_TIPS[kind] ?? NINJUTSU_COMBAT_TIPS.ikazuchi;
}
