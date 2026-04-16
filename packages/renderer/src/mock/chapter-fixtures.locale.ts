import type { Locale } from '@/app/i18n'

type MutableDatabase = {
  locale?: Locale
  chapters: Record<string, any>
}

export function localizeChapterMockDatabase(locale: Locale, database: MutableDatabase): MutableDatabase {
  database.locale = locale
  if (locale !== 'zh-CN') {
    return database
  }

  const signalsInRain = database.chapters['chapter-signals-in-rain']
  if (signalsInRain) {
    signalsInRain.title = '雨中信号'
    signalsInRain.summary = '在公共压力与隐秘筹码之间重新编排同一章的节奏线。'
    signalsInRain.scenes = [
      {
        ...signalsInRain.scenes[0],
        title: '午夜站台',
        summary: 'Ren 必须在站台目击者把账本变成公开筹码之前锁定交易。',
        purpose: '在不翻开账本的前提下，把交易推进到公开可见的僵局。',
        pov: '任·沃斯',
        location: '东行月台',
        conflict: 'Ren 需要筹码，美伊需要更高代价，站务员让一切都不能失控。',
        reveal: '信使暗号仍只对 Ren 可读。',
        statusLabel: '当前',
        proseStatusLabel: '需修订',
        runStatusLabel: '已暂停',
        lastRunLabel: '运行 07',
      },
      {
        ...signalsInRain.scenes[1],
        title: '候车厅延误',
        summary: '人潮阻塞会拖慢离场，但不会解决谁掌控信使线索。',
        purpose: '继续压住离场节拍，让压力留到下一场。',
        pov: '美伊·阿登',
        location: '候车大厅',
        conflict: '拥堵拖慢节奏，但 Ren 不能失去主动权。',
        reveal: '目击者压力从月台延伸到室内。',
        statusLabel: '排队中',
        proseStatusLabel: '待起草',
        runStatusLabel: '未开始',
        lastRunLabel: '未运行',
      },
      {
        ...signalsInRain.scenes[2],
        title: '售票窗',
        summary: '别名继续留在台外，Mei 试探 Ren 是否会拿确定性交换速度。',
        purpose: '把“速度”和“确定性”的交换压到同一镜头里。',
        pov: '任·沃斯',
        location: '售票窗',
        conflict: 'Ren 想加速离场，美伊要逼他先表态。',
        reveal: '化名仍然没有进入公开层。',
        statusLabel: '受控',
        proseStatusLabel: '待起草',
        runStatusLabel: '已守护',
        lastRunLabel: '运行 03',
      },
      {
        ...signalsInRain.scenes[3],
        title: '发车钟',
        summary: '本章仍需要一个不会过早压垮目击者压力的终局钟声位置。',
        purpose: '为本章找到不破坏见证压力的离场铃点。',
        pov: '站务员',
        location: '离场门',
        conflict: '铃声一旦太早落下，章节的对峙压力就会塌掉。',
        reveal: '终局节拍仍缺一个安全的过渡。',
        statusLabel: '待定',
        proseStatusLabel: '待起草',
        runStatusLabel: '未开始',
        lastRunLabel: '未运行',
      },
    ]
    signalsInRain.inspector = {
      chapterNotes: ['目击者压力放在辅助上下文，不放进主舞台文案。', '排序属于结构层，这里不引入正文合并。'],
      problemsSummary: '当前未决点集中在发车铃时序、信使线归属和别名是否会过早暴露。',
      assemblyHints: ['让站台目击压力延续到候车厅，而不是在月台上耗尽。', '售票窗一场只推进交换条件，不解决账本归属。'],
    }
  }

  const openWaterSignals = database.chapters['chapter-open-water-signals']
  if (openWaterSignals) {
    openWaterSignals.title = '开阔水域信号'
    openWaterSignals.summary = '用更开阔的场景切换验证同一份 chapter dataset 的多视图复用。'
    openWaterSignals.scenes = [
      {
        ...openWaterSignals.scenes[0],
        title: '仓桥交接',
        summary: '第一次交接保持试探性，让背叛节拍继续延后。',
        purpose: '把第一次交接压在“仍可撤回”的边缘上。',
        pov: '莱娅',
        location: '仓桥',
        conflict: '任何一步都可能让货物归属暴露得太早。',
        reveal: '背叛线仍只在动作里出现，不在对白里落明。',
        statusLabel: '当前',
        proseStatusLabel: '待起草',
        runStatusLabel: '运行中',
        lastRunLabel: '运行 04',
      },
      {
        ...openWaterSignals.scenes[1],
        title: '运河哨位',
        summary: '哨位场景会收紧信任压力，但不会坐实包裹归属。',
        purpose: '继续施压信任问题，不提前给答案。',
        pov: '莱娅',
        location: '运河哨位',
        conflict: '所有人都知道包裹重要，但没人能先承认它属于谁。',
        reveal: '真正的接收方仍未暴露。',
        statusLabel: '排队中',
        proseStatusLabel: '待起草',
        runStatusLabel: '未开始',
        lastRunLabel: '未运行',
      },
      {
        ...openWaterSignals.scenes[2],
        title: '黎明滑道',
        summary: '滑道离场仍需要一个更清晰的怀疑到行动过渡。',
        purpose: '补齐从怀疑到行动的转折。',
        pov: '监视者',
        location: '滑道出口',
        conflict: '一旦动作太快，前面的试探就会白费。',
        reveal: '离场路径还缺一个可信的承接点。',
        statusLabel: '待定',
        proseStatusLabel: '待起草',
        runStatusLabel: '未开始',
        lastRunLabel: '未运行',
      },
    ]
    openWaterSignals.inspector = {
      chapterNotes: ['不同视图仍然指向同一个章节身份。', '这个脚手架不引入运行态底部面板。'],
      problemsSummary: '主要风险在于第一场和最后一场之间的承接张力还不够顺。',
      assemblyHints: ['把仓桥交接的迟疑直接传给运河哨位，而不是另起一条疑心线。'],
    }
  }

  return database
}
