import { KarmaAlignmentId, KarmaDialogueLine, KarmaFinalReward } from './types';

export interface KarmaEndingScript {
  alignmentId: KarmaAlignmentId;
  heading: string;
  badge: string;
  epilogue: string;
  accentClass: string;
  lines: KarmaDialogueLine[];
}

export interface KarmaArchiveRecord {
  count: number;
  bestKarma: number;
  rewardItemName: string;
  rewardTitle: string;
  unlockedAt: number;
}

export interface KarmaArchiveData {
  unlockedEndings: Partial<Record<KarmaAlignmentId, KarmaArchiveRecord>>;
  lifetimeRescued: number;
  lifetimeHarmed: number;
}

const KARMA_STORAGE_KEY = 'kage_karma_archive_v1';

export function getKarmaAlignmentId(karma: number): KarmaAlignmentId {
  if (karma >= 40) return 'luminous';
  if (karma >= 15) return 'protector';
  if (karma >= -14) return 'neutral';
  if (karma >= -39) return 'ruthless';
  return 'crimson';
}

export function getKarmaLabel(karma: number): string {
  const id = getKarmaAlignmentId(karma);
  if (id === 'luminous') return 'HONRA LUMINOSA';
  if (id === 'protector') return 'PROTETOR';
  if (id === 'neutral') return 'NEUTRO';
  if (id === 'ruthless') return 'IMPLACÁVEL';
  return 'DEMÔNIO CARMESIM';
}

function pluralCivis(n: number): string {
  return n === 1 ? '1 civil' : `${n} civis`;
}

export function computeKarmaFinalReward(
  karma: number,
  rescued: number,
  harmed: number,
  enemiesDefeated: number,
  scoreMult: number
): KarmaFinalReward {
  const alignmentId = getKarmaAlignmentId(karma);

  if (alignmentId === 'luminous') {
    const baseBonusPoints = Math.round(5000 * scoreMult);
    const perUnitBonus = Math.round(600 * scoreMult);
    const unitCount = rescued;
    return {
      alignmentId,
      alignmentTitle: 'Honra Luminosa',
      badgeLabel: 'RECOMPENSA DA AURORA',
      rewardItemName: 'Talismã Dourado do Clã Oboro',
      rewardTitle: 'Guardião da Lua Clara',
      rewardDescription:
        'Relíquia entregue pelos aldeões salvos. Concede +5.000 pts base e +600 pts por cada civil resgatado ao longo da jornada.',
      baseBonusPoints,
      perUnitBonus,
      unitLabel: 'civis salvos',
      unitCount,
      totalRewardPoints: baseBonusPoints + perUnitBonus * unitCount,
      accentColor: '#34D399',
    };
  }

  if (alignmentId === 'protector') {
    const baseBonusPoints = Math.round(3000 * scoreMult);
    const perUnitBonus = Math.round(400 * scoreMult);
    const unitCount = rescued;
    return {
      alignmentId,
      alignmentTitle: 'Protetor da Alvorada',
      badgeLabel: 'BÊNÇÃO DOS SOBREVIVENTES',
      rewardItemName: 'Lanterna Sagrada de Jade',
      rewardTitle: 'Escudo dos Inocentes',
      rewardDescription:
        'Presente dos reféns libertados. Concede +3.000 pts base e +400 pts por cada civil resgatado.',
      baseBonusPoints,
      perUnitBonus,
      unitLabel: 'civis salvos',
      unitCount,
      totalRewardPoints: baseBonusPoints + perUnitBonus * unitCount,
      accentColor: '#6EE7B7',
    };
  }

  if (alignmentId === 'neutral') {
    const baseBonusPoints = Math.round(2200 * scoreMult);
    const perUnitBonus = Math.round(200 * scoreMult);
    const unitCount = Math.max(0, rescued - harmed);
    return {
      alignmentId,
      alignmentTitle: 'Sombra Errante',
      badgeLabel: 'PAGO NO SILÊNCIO',
      rewardItemName: 'Pergaminho do Equilíbrio Oculto',
      rewardTitle: 'Lâmina Sem Nome',
      rewardDescription:
        'Contrato cumprido sem laços ou dívidas. Concede +2.200 pts base e +200 pts por saldo positivo de resgates.',
      baseBonusPoints,
      perUnitBonus,
      unitLabel: 'saldo de resgates',
      unitCount,
      totalRewardPoints: baseBonusPoints + perUnitBonus * unitCount,
      accentColor: '#FBBF24',
    };
  }

  if (alignmentId === 'ruthless') {
    const baseBonusPoints = Math.round(2800 * scoreMult);
    const perUnitBonus = Math.round(40 * scoreMult);
    const unitCount = enemiesDefeated;
    return {
      alignmentId,
      alignmentTitle: 'Lâmina Implacável',
      badgeLabel: 'ESPÓLIO DE GUERRA',
      rewardItemName: 'Selo de Ferro da Fúria Fria',
      rewardTitle: 'Caçador Sem Trégua',
      rewardDescription:
        'Troféu forjado na brutalidade do combate. Concede +2.800 pts base e +40 pts por cada inimigo abatido.',
      baseBonusPoints,
      perUnitBonus,
      unitLabel: 'inimigos abatidos',
      unitCount,
      totalRewardPoints: baseBonusPoints + perUnitBonus * unitCount,
      accentColor: '#FB923C',
    };
  }

  const baseBonusPoints = Math.round(4800 * scoreMult);
  const perUnitBonus = Math.round(65 * scoreMult);
  const unitCount = enemiesDefeated;
  return {
    alignmentId,
    alignmentTitle: 'Demônio Carmesim',
    badgeLabel: 'TRIBUTO DA LUA SANGRENTA',
    rewardItemName: 'Máscara do Eclipse Sangrento',
    rewardTitle: 'Senhor da Lua Sangrenta',
    rewardDescription:
      'Insígnia temida até pelos generais do Shogun. Concede +4.800 pts base e +65 pts por cada inimigo abatido.',
    baseBonusPoints,
    perUnitBonus,
    unitLabel: 'inimigos abatidos',
    unitCount,
    totalRewardPoints: baseBonusPoints + perUnitBonus * unitCount,
    accentColor: '#FB7185',
  };
}

export function getKarmaVictoryDialogue(
  karma: number,
  rescued: number,
  harmed: number,
  enemiesDefeated: number
): KarmaEndingScript {
  const alignmentId = getKarmaAlignmentId(karma);

  if (alignmentId === 'luminous') {
    return {
      alignmentId,
      heading: 'Final Luminoso: Guardião do Clã Oboro',
      badge: 'CAMINHO DA HONRA LUMINOSA',
      epilogue:
        'Sua lâmina protegeu os inocentes sob a lua carmesim. As vilas acendem lanternas douradas para guiar seu retorno.',
      accentClass: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
      lines: [
        {
          speaker: 'Akuma, Imperador do Eclipse',
          role: 'Último Suspiro',
          tone: 'shadow',
          text: 'Como... você lutou cercado de inimigos sem sacrificar sua humanidade? Essa misericórdia deveria ter sido sua fraqueza!',
        },
        {
          speaker: 'Ancião Tenzin',
          role: 'Mestre do Clã Oboro',
          tone: 'honor',
          text: `Você libertou ${pluralCivis(rescued)} das garras do Eclipse${harmed === 0 ? ' sem ferir um único inocente' : ''}. O verdadeiro shinobi não corta para destruir, mas para proteger.`,
        },
        {
          speaker: 'Reféns Libertados',
          role: 'Vozes da Alvorada',
          tone: 'honor',
          text: 'O clã ergueu este Talismã Dourado em seu nome, Kage. Enquanto a lua brilhar, sua honra viverá em nossas casas.',
        },
        {
          speaker: 'Kage',
          role: 'Lâmina da Noite',
          tone: 'honor',
          text: 'A noite terminou. Guardem o talismã como promessa: se as sombras retornarem, minha katana responderá novamente.',
        },
      ],
    };
  }

  if (alignmentId === 'protector') {
    return {
      alignmentId,
      heading: 'Final Honroso: Protetor da Alvorada',
      badge: 'CAMINHO DO PROTETOR',
      epilogue:
        'Apesar das cicatrizes da guerra, você estendeu a mão aos reféns no caos da batalha e devolveu a paz às províncias.',
      accentClass: 'border-emerald-400/55 bg-emerald-950/35 text-emerald-200',
      lines: [
        {
          speaker: 'Akuma, Imperador do Eclipse',
          role: 'Derrotado',
          tone: 'shadow',
          text: 'Mesmo dividido entre a guerra e o resgate de aldeões, sua lâmina atravessou minha guarda... Impressionante, Oboro.',
        },
        {
          speaker: 'Ancião Tenzin',
          role: 'Mestre do Clã Oboro',
          tone: 'honor',
          text: `Os relatos chegaram à cidadela: ${pluralCivis(rescued)} foram salvos ao longo do caminho${harmed > 0 ? `, apesar das ${harmed} baixas no fogo cruzado` : ''}.`,
        },
        {
          speaker: 'Kage',
          role: 'Lâmina da Noite',
          tone: 'honor',
          text: 'Salvei quem pude alcançar na tempestade. Recebo a Lanterna de Jade para lembrar dos que ficaram sob minha guarda.',
        },
      ],
    };
  }

  if (alignmentId === 'neutral') {
    return {
      alignmentId,
      heading: 'Final Neutro: Sombra Errante',
      badge: 'EQUILÍBRIO SILENCIOSO',
      epilogue:
        'O Império do Eclipse ruiu, e você desaparece na névoa antes do amanhecer — nem herói celebrado, nem tirano temido.',
      accentClass: 'border-amber-500/50 bg-slate-900/80 text-amber-300',
      lines: [
        {
          speaker: 'Akuma, Imperador do Eclipse',
          role: 'Derrotado',
          tone: 'shadow',
          text: 'Você não busca tronos nem aplausos... Quem é você realmente, assassino sem bandeira?',
        },
        {
          speaker: 'Voz das Sombras',
          role: 'Crônica do Clã',
          tone: 'neutral',
          text: `Entre ${pluralCivis(rescued)} salvos e ${harmed} feridos, a lâmina manteve apenas o equilíbrio frio da missão.`,
        },
        {
          speaker: 'Kage',
          role: 'Lâmina da Noite',
          tone: 'neutral',
          text: 'O contrato está encerrado. Deixo o Pergaminho do Silêncio sobre o altar e sigo antes que o sol nasça.',
        },
      ],
    };
  }

  if (alignmentId === 'ruthless') {
    return {
      alignmentId,
      heading: 'Final Implacável: Caçador Sem Trégua',
      badge: 'CAMINHO DA FÚRIA FRIA',
      epilogue:
        'Sua katana não hesitou diante de nada. A vitória veio rápido, mas os sobreviventes fecham as portas ao ouvir seus passos.',
      accentClass: 'border-orange-500/60 bg-orange-950/45 text-orange-300',
      lines: [
        {
          speaker: 'Akuma, Imperador do Eclipse',
          role: 'Último Suspiro',
          tone: 'shadow',
          text: `Você abateu ${enemiesDefeated} guerreiros sem piscar... e nem os inocentes escaparam do seu aço.`,
        },
        {
          speaker: 'Ancião Tenzin',
          role: 'Mestre do Clã Oboro',
          tone: 'neutral',
          text: `A cidadela caiu, Kage, mas ${pluralCivis(harmed)} pagaram o preço da sua impaciência. Que tipo de paz é essa?`,
        },
        {
          speaker: 'Kage',
          role: 'Lâmina da Noite',
          tone: 'shadow',
          text: 'Guerra não se vence com hesitação. Tomo o Selo de Ferro — o medo manterá os sobreviventes vivos.',
        },
      ],
    };
  }

  return {
    alignmentId,
    heading: 'Final Sombrio: Senhor da Lua Sangrenta',
    badge: 'CAMINHO DO DEMÔNIO CARMESIM',
    epilogue:
      'Nenhum refém ou inimigo deteve sua carnificina. Ao cair do Imperador, uma sombra ainda mais temida ergue-se sobre o trono.',
    accentClass: 'border-rose-500/70 bg-rose-950/50 text-rose-300',
    lines: [
      {
        speaker: 'Akuma, Imperador do Eclipse',
        role: 'Curvado na Poeira',
        tone: 'shadow',
        text: `Haha... Eu temia um salvador, mas criei um demônio pior que eu! ${pluralCivis(harmed)} caíram sob sua lâmina!`,
      },
      {
        speaker: 'Sobrevivente da Vila',
        role: 'Olhar Aterrorizado',
        tone: 'shadow',
        text: 'Ele não veio nos libertar... Apaguem as tochas! O Eclipse não acabou — apenas trocou de rosto!',
      },
      {
        speaker: 'Kage',
        role: 'Senhor da Lua Sangrenta',
        tone: 'shadow',
        text: `Os fracos temem a escuridão porque não sabem empunhá-la. ${enemiesDefeated} almas selaram meu pacto. A Máscara do Eclipse agora é minha.`,
      },
    ],
  };
}

export function getKarmaStageClearQuote(
  karma: number,
  stageRescued: number,
  stageHarmed: number,
  stageTotal: number
): string {
  if (stageHarmed > 0 && stageRescued === 0) {
    return 'Os aldeões recuam diante da sua lâmina — ferir inocentes corrompe o seu Karma e enfraquece a confiança do clã.';
  }
  if (stageHarmed > 0) {
    return `Você salvou ${pluralCivis(stageRescued)} nesta fase, mas ${pluralCivis(stageHarmed)} ficaram feridos no combate.`;
  }
  if (stageTotal > 0 && stageRescued >= stageTotal) {
    return karma >= 40
      ? 'Todos os reféns desta fase foram resgatados ilesos! Sua fama como Guardião de Oboro ecoa pelas províncias.'
      : 'Todos os reféns da área foram salvos em segurança, elevando seu Karma para o caminho da honra.';
  }
  if (stageRescued > 0) {
    return `${pluralCivis(stageRescued)} agradecem sua ajuda, mas ainda havia reféns aguardando resgate pelo cenário.`;
  }
  return 'Nenhum civil foi resgatado ou ferido nesta fase — seu Karma permanece inalterado.';
}

export function loadKarmaArchive(): KarmaArchiveData {
  try {
    const raw = localStorage.getItem(KARMA_STORAGE_KEY);
    if (!raw) {
      return { unlockedEndings: {}, lifetimeRescued: 0, lifetimeHarmed: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<KarmaArchiveData>;
    return {
      unlockedEndings:
        parsed.unlockedEndings && typeof parsed.unlockedEndings === 'object'
          ? parsed.unlockedEndings
          : {},
      lifetimeRescued: typeof parsed.lifetimeRescued === 'number' ? parsed.lifetimeRescued : 0,
      lifetimeHarmed: typeof parsed.lifetimeHarmed === 'number' ? parsed.lifetimeHarmed : 0,
    };
  } catch {
    return { unlockedEndings: {}, lifetimeRescued: 0, lifetimeHarmed: 0 };
  }
}

export function recordKarmaEndingInStore(
  karma: number,
  reward: KarmaFinalReward,
  rescued: number,
  harmed: number
): KarmaArchiveData {
  const archive = loadKarmaArchive();
  const prev = archive.unlockedEndings[reward.alignmentId];
  archive.unlockedEndings[reward.alignmentId] = {
    count: (prev?.count ?? 0) + 1,
    bestKarma: prev ? Math.max(prev.bestKarma, karma) : karma,
    rewardItemName: reward.rewardItemName,
    rewardTitle: reward.rewardTitle,
    unlockedAt: prev?.unlockedAt ?? Date.now(),
  };
  archive.lifetimeRescued += rescued;
  archive.lifetimeHarmed += harmed;
  try {
    localStorage.setItem(KARMA_STORAGE_KEY, JSON.stringify(archive));
  } catch {
    // Ignore storage failures
  }
  return archive;
}
