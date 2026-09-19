/* Original sentence-pattern practice, v93. */
(function(root){
const additions=[
  {
    "id": "CL93-01-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、本を読みました。",
    "solutions": [
      "I read a book yesterday.",
      "Yesterday, I read a book."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、本を読みました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、本を読みませんでした。",
    "solutions": [
      "I did not read a book yesterday.",
      "Yesterday, I did not read a book.",
      "I didn't read a book yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、本を読みませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・本",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、本を読みましたか。",
    "solutions": [
      "Did you read a book yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、本を読みましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、本を読むつもりです。",
    "solutions": [
      "I will read a book tomorrow.",
      "Tomorrow, I will read a book."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、本を読むつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は本を読むことができます。",
    "solutions": [
      "I can read a book."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は本を読むことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、本を読まなければなりません。",
    "solutions": [
      "I must read a book today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、本を読まなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は本を読みたいです。",
    "solutions": [
      "I want to read a book."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は本を読みたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、本を読む予定です。",
    "solutions": [
      "I am going to read a book tomorrow.",
      "Tomorrow, I am going to read a book."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、本を読む予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は本を読み終えました。",
    "solutions": [
      "I finished reading a book."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は本を読み終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・本",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう本を読みました。",
    "solutions": [
      "I have already read a book.",
      "I have read a book already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう本を読みました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・本",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう本を読みましたか。",
    "solutions": [
      "Have you read a book yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう本を読みましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・本",
    "prompt": "日本語に合う英文を作りましょう。\nその本は私の姉によって読まれたものです。",
    "solutions": [
      "The book was read by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その本は私の姉によって読まれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・本",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日読んだ本です。",
    "solutions": [
      "This is the book that I read yesterday.",
      "This is the book I read yesterday.",
      "This is the book which I read yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日読んだ本です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・本",
    "prompt": "日本語に合う英文を作りましょう。\n本を読んでいる男の子は私の弟です。",
    "solutions": [
      "The boy reading a book is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：本を読んでいる男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・本",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって読まれた本です。",
    "solutions": [
      "This is the book read by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって読まれた本です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・本",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が本を読んだのか、私は知りません。",
    "solutions": [
      "I do not know why he read a book.",
      "I don't know why he read a book."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が本を読んだのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、本を読みました。",
    "solutions": [
      "I read a book before I ate dinner.",
      "Before I ate dinner, I read a book."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、本を読みました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は本を読むつもりです。",
    "solutions": [
      "If I have time, I will read a book.",
      "I will read a book if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は本を読むつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・本",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、本を読んでいます。",
    "solutions": [
      "I am reading a book now.",
      "Now, I am reading a book."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、本を読んでいます。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・本",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に本を読みます。",
    "solutions": [
      "He reads a book every Sunday.",
      "Every Sunday, he reads a book."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に本を読みます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-001",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・本",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に本を読む女の子は私の友達です。",
    "solutions": [
      "The girl who reads a book every Sunday is my friend.",
      "The girl that reads a book every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に本を読む女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、手紙を書きました。",
    "solutions": [
      "I wrote a letter yesterday.",
      "Yesterday, I wrote a letter."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、手紙を書きました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、手紙を書きませんでした。",
    "solutions": [
      "I did not write a letter yesterday.",
      "Yesterday, I did not write a letter.",
      "I didn't write a letter yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、手紙を書きませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、手紙を書きましたか。",
    "solutions": [
      "Did you write a letter yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、手紙を書きましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、手紙を書くつもりです。",
    "solutions": [
      "I will write a letter tomorrow.",
      "Tomorrow, I will write a letter."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、手紙を書くつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は手紙を書くことができます。",
    "solutions": [
      "I can write a letter."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は手紙を書くことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、手紙を書かなければなりません。",
    "solutions": [
      "I must write a letter today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、手紙を書かなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は手紙を書きたいです。",
    "solutions": [
      "I want to write a letter."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は手紙を書きたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、手紙を書く予定です。",
    "solutions": [
      "I am going to write a letter tomorrow.",
      "Tomorrow, I am going to write a letter."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、手紙を書く予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は手紙を書き終えました。",
    "solutions": [
      "I finished writing a letter."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は手紙を書き終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう手紙を書きました。",
    "solutions": [
      "I have already written a letter.",
      "I have written a letter already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう手紙を書きました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう手紙を書きましたか。",
    "solutions": [
      "Have you written a letter yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう手紙を書きましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nその手紙は私の姉によって書かれたものです。",
    "solutions": [
      "The letter was written by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その手紙は私の姉によって書かれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日書いた手紙です。",
    "solutions": [
      "This is the letter that I wrote yesterday.",
      "This is the letter I wrote yesterday.",
      "This is the letter which I wrote yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日書いた手紙です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n手紙を書いている男の子は私の弟です。",
    "solutions": [
      "The boy writing a letter is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：手紙を書いている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって書かれた手紙です。",
    "solutions": [
      "This is the letter written by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって書かれた手紙です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・手紙",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が手紙を書いたのか、私は知りません。",
    "solutions": [
      "I do not know why he wrote a letter.",
      "I don't know why he wrote a letter."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が手紙を書いたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、手紙を書きました。",
    "solutions": [
      "I wrote a letter before I ate dinner.",
      "Before I ate dinner, I wrote a letter."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、手紙を書きました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は手紙を書くつもりです。",
    "solutions": [
      "If I have time, I will write a letter.",
      "I will write a letter if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は手紙を書くつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、手紙を書いています。",
    "solutions": [
      "I am writing a letter now.",
      "Now, I am writing a letter."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、手紙を書いています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に手紙を書きます。",
    "solutions": [
      "He writes a letter every Sunday.",
      "Every Sunday, he writes a letter."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に手紙を書きます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-002",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・手紙",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に手紙を書く女の子は私の友達です。",
    "solutions": [
      "The girl who writes a letter every Sunday is my friend.",
      "The girl that writes a letter every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に手紙を書く女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、絵を描きました。",
    "solutions": [
      "I drew a picture yesterday.",
      "Yesterday, I drew a picture."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、絵を描きました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、絵を描きませんでした。",
    "solutions": [
      "I did not draw a picture yesterday.",
      "Yesterday, I did not draw a picture.",
      "I didn't draw a picture yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、絵を描きませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・絵",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、絵を描きましたか。",
    "solutions": [
      "Did you draw a picture yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、絵を描きましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、絵を描くつもりです。",
    "solutions": [
      "I will draw a picture tomorrow.",
      "Tomorrow, I will draw a picture."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、絵を描くつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は絵を描くことができます。",
    "solutions": [
      "I can draw a picture."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は絵を描くことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、絵を描かなければなりません。",
    "solutions": [
      "I must draw a picture today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、絵を描かなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は絵を描きたいです。",
    "solutions": [
      "I want to draw a picture."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は絵を描きたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、絵を描く予定です。",
    "solutions": [
      "I am going to draw a picture tomorrow.",
      "Tomorrow, I am going to draw a picture."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、絵を描く予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は絵を描き終えました。",
    "solutions": [
      "I finished drawing a picture."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は絵を描き終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう絵を描きました。",
    "solutions": [
      "I have already drawn a picture.",
      "I have drawn a picture already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう絵を描きました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・絵",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう絵を描きましたか。",
    "solutions": [
      "Have you drawn a picture yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう絵を描きましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・絵",
    "prompt": "日本語に合う英文を作りましょう。\nその絵は私の姉によって描かれたものです。",
    "solutions": [
      "The picture was drawn by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その絵は私の姉によって描かれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日描いた絵です。",
    "solutions": [
      "This is the picture that I drew yesterday.",
      "This is the picture I drew yesterday.",
      "This is the picture which I drew yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日描いた絵です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・絵",
    "prompt": "日本語に合う英文を作りましょう。\n絵を描いている男の子は私の弟です。",
    "solutions": [
      "The boy drawing a picture is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：絵を描いている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・絵",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって描かれた絵です。",
    "solutions": [
      "This is the picture drawn by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって描かれた絵です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・絵",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が絵を描いたのか、私は知りません。",
    "solutions": [
      "I do not know why he drew a picture.",
      "I don't know why he drew a picture."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が絵を描いたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、絵を描きました。",
    "solutions": [
      "I drew a picture before I ate dinner.",
      "Before I ate dinner, I drew a picture."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、絵を描きました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は絵を描くつもりです。",
    "solutions": [
      "If I have time, I will draw a picture.",
      "I will draw a picture if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は絵を描くつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・絵",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、絵を描いています。",
    "solutions": [
      "I am drawing a picture now.",
      "Now, I am drawing a picture."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、絵を描いています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・絵",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に絵を描きます。",
    "solutions": [
      "He draws a picture every Sunday.",
      "Every Sunday, he draws a picture."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に絵を描きます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-003",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・絵",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に絵を描く女の子は私の友達です。",
    "solutions": [
      "The girl who draws a picture every Sunday is my friend.",
      "The girl that draws a picture every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に絵を描く女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ケーキを作りました。",
    "solutions": [
      "I made a cake yesterday.",
      "Yesterday, I made a cake."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、ケーキを作りました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ケーキを作りませんでした。",
    "solutions": [
      "I did not make a cake yesterday.",
      "Yesterday, I did not make a cake.",
      "I didn't make a cake yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、ケーキを作りませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、ケーキを作りましたか。",
    "solutions": [
      "Did you make a cake yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、ケーキを作りましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ケーキを作るつもりです。",
    "solutions": [
      "I will make a cake tomorrow.",
      "Tomorrow, I will make a cake."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、ケーキを作るつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私はケーキを作ることができます。",
    "solutions": [
      "I can make a cake."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はケーキを作ることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、ケーキを作らなければなりません。",
    "solutions": [
      "I must make a cake today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、ケーキを作らなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私はケーキを作りたいです。",
    "solutions": [
      "I want to make a cake."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はケーキを作りたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ケーキを作る予定です。",
    "solutions": [
      "I am going to make a cake tomorrow.",
      "Tomorrow, I am going to make a cake."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、ケーキを作る予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私はケーキを作り終えました。",
    "solutions": [
      "I finished making a cake."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はケーキを作り終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうケーキを作りました。",
    "solutions": [
      "I have already made a cake.",
      "I have made a cake already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうケーキを作りました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうケーキを作りましたか。",
    "solutions": [
      "Have you made a cake yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうケーキを作りましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nそのケーキは私の姉によって作られたものです。",
    "solutions": [
      "The cake was made by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのケーキは私の姉によって作られたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日作ったケーキです。",
    "solutions": [
      "This is the cake that I made yesterday.",
      "This is the cake I made yesterday.",
      "This is the cake which I made yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日作ったケーキです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nケーキを作っている男の子は私の弟です。",
    "solutions": [
      "The boy making a cake is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：ケーキを作っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって作られたケーキです。",
    "solutions": [
      "This is the cake made by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって作られたケーキです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がケーキを作ったのか、私は知りません。",
    "solutions": [
      "I do not know why he made a cake.",
      "I don't know why he made a cake."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がケーキを作ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、ケーキを作りました。",
    "solutions": [
      "I made a cake before I ate dinner.",
      "Before I ate dinner, I made a cake."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、ケーキを作りました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はケーキを作るつもりです。",
    "solutions": [
      "If I have time, I will make a cake.",
      "I will make a cake if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はケーキを作るつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、ケーキを作っています。",
    "solutions": [
      "I am making a cake now.",
      "Now, I am making a cake."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、ケーキを作っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にケーキを作ります。",
    "solutions": [
      "He makes a cake every Sunday.",
      "Every Sunday, he makes a cake."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にケーキを作ります。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-004",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ケーキ",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にケーキを作る女の子は私の友達です。",
    "solutions": [
      "The girl who makes a cake every Sunday is my friend.",
      "The girl that makes a cake every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にケーキを作る女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、写真を撮りました。",
    "solutions": [
      "I took a photo yesterday.",
      "Yesterday, I took a photo."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、写真を撮りました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、写真を撮りませんでした。",
    "solutions": [
      "I did not take a photo yesterday.",
      "Yesterday, I did not take a photo.",
      "I didn't take a photo yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、写真を撮りませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・写真",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、写真を撮りましたか。",
    "solutions": [
      "Did you take a photo yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、写真を撮りましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、写真を撮るつもりです。",
    "solutions": [
      "I will take a photo tomorrow.",
      "Tomorrow, I will take a photo."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、写真を撮るつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は写真を撮ることができます。",
    "solutions": [
      "I can take a photo."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は写真を撮ることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、写真を撮らなければなりません。",
    "solutions": [
      "I must take a photo today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、写真を撮らなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は写真を撮りたいです。",
    "solutions": [
      "I want to take a photo."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は写真を撮りたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、写真を撮る予定です。",
    "solutions": [
      "I am going to take a photo tomorrow.",
      "Tomorrow, I am going to take a photo."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、写真を撮る予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は写真を撮り終えました。",
    "solutions": [
      "I finished taking a photo."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は写真を撮り終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう写真を撮りました。",
    "solutions": [
      "I have already taken a photo.",
      "I have taken a photo already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう写真を撮りました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・写真",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう写真を撮りましたか。",
    "solutions": [
      "Have you taken a photo yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう写真を撮りましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・写真",
    "prompt": "日本語に合う英文を作りましょう。\nその写真は私の姉によって撮られたものです。",
    "solutions": [
      "The photo was taken by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その写真は私の姉によって撮られたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日撮った写真です。",
    "solutions": [
      "This is the photo that I took yesterday.",
      "This is the photo I took yesterday.",
      "This is the photo which I took yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日撮った写真です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・写真",
    "prompt": "日本語に合う英文を作りましょう。\n写真を撮っている男の子は私の弟です。",
    "solutions": [
      "The boy taking a photo is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：写真を撮っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・写真",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって撮られた写真です。",
    "solutions": [
      "This is the photo taken by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって撮られた写真です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・写真",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が写真を撮ったのか、私は知りません。",
    "solutions": [
      "I do not know why he took a photo.",
      "I don't know why he took a photo."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が写真を撮ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、写真を撮りました。",
    "solutions": [
      "I took a photo before I ate dinner.",
      "Before I ate dinner, I took a photo."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、写真を撮りました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は写真を撮るつもりです。",
    "solutions": [
      "If I have time, I will take a photo.",
      "I will take a photo if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は写真を撮るつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・写真",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、写真を撮っています。",
    "solutions": [
      "I am taking a photo now.",
      "Now, I am taking a photo."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、写真を撮っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・写真",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に写真を撮ります。",
    "solutions": [
      "He takes a photo every Sunday.",
      "Every Sunday, he takes a photo."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に写真を撮ります。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-005",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・写真",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に写真を撮る女の子は私の友達です。",
    "solutions": [
      "The girl who takes a photo every Sunday is my friend.",
      "The girl that takes a photo every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に写真を撮る女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、映画を見ました。",
    "solutions": [
      "I watched a movie yesterday.",
      "Yesterday, I watched a movie."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、映画を見ました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、映画を見ませんでした。",
    "solutions": [
      "I did not watch a movie yesterday.",
      "Yesterday, I did not watch a movie.",
      "I didn't watch a movie yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、映画を見ませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・映画",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、映画を見ましたか。",
    "solutions": [
      "Did you watch a movie yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、映画を見ましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、映画を見るつもりです。",
    "solutions": [
      "I will watch a movie tomorrow.",
      "Tomorrow, I will watch a movie."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、映画を見るつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は映画を見ることができます。",
    "solutions": [
      "I can watch a movie."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は映画を見ることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、映画を見なければなりません。",
    "solutions": [
      "I must watch a movie today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、映画を見なければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は映画を見たいです。",
    "solutions": [
      "I want to watch a movie."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は映画を見たいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、映画を見る予定です。",
    "solutions": [
      "I am going to watch a movie tomorrow.",
      "Tomorrow, I am going to watch a movie."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、映画を見る予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は映画を見終えました。",
    "solutions": [
      "I finished watching a movie."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は映画を見終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう映画を見ました。",
    "solutions": [
      "I have already watched a movie.",
      "I have watched a movie already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう映画を見ました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・映画",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう映画を見ましたか。",
    "solutions": [
      "Have you watched a movie yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう映画を見ましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・映画",
    "prompt": "日本語に合う英文を作りましょう。\nその映画は私の姉によって見られたものです。",
    "solutions": [
      "The movie was watched by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その映画は私の姉によって見られたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日見た映画です。",
    "solutions": [
      "This is the movie that I watched yesterday.",
      "This is the movie I watched yesterday.",
      "This is the movie which I watched yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日見た映画です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・映画",
    "prompt": "日本語に合う英文を作りましょう。\n映画を見ている男の子は私の弟です。",
    "solutions": [
      "The boy watching a movie is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：映画を見ている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・映画",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって見られた映画です。",
    "solutions": [
      "This is the movie watched by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって見られた映画です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・映画",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が映画を見たのか、私は知りません。",
    "solutions": [
      "I do not know why he watched a movie.",
      "I don't know why he watched a movie."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が映画を見たのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、映画を見ました。",
    "solutions": [
      "I watched a movie before I ate dinner.",
      "Before I ate dinner, I watched a movie."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、映画を見ました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は映画を見るつもりです。",
    "solutions": [
      "If I have time, I will watch a movie.",
      "I will watch a movie if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は映画を見るつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・映画",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、映画を見ています。",
    "solutions": [
      "I am watching a movie now.",
      "Now, I am watching a movie."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、映画を見ています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・映画",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に映画を見ます。",
    "solutions": [
      "He watches a movie every Sunday.",
      "Every Sunday, he watches a movie."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に映画を見ます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-006",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・映画",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に映画を見る女の子は私の友達です。",
    "solutions": [
      "The girl who watches a movie every Sunday is my friend.",
      "The girl that watches a movie every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に映画を見る女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、部屋を掃除しました。",
    "solutions": [
      "I cleaned a room yesterday.",
      "Yesterday, I cleaned a room."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、部屋を掃除しました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、部屋を掃除しませんでした。",
    "solutions": [
      "I did not clean a room yesterday.",
      "Yesterday, I did not clean a room.",
      "I didn't clean a room yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、部屋を掃除しませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、部屋を掃除しましたか。",
    "solutions": [
      "Did you clean a room yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、部屋を掃除しましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、部屋を掃除するつもりです。",
    "solutions": [
      "I will clean a room tomorrow.",
      "Tomorrow, I will clean a room."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、部屋を掃除するつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は部屋を掃除することができます。",
    "solutions": [
      "I can clean a room."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は部屋を掃除することができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、部屋を掃除しなければなりません。",
    "solutions": [
      "I must clean a room today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、部屋を掃除しなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は部屋を掃除したいです。",
    "solutions": [
      "I want to clean a room."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は部屋を掃除したいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、部屋を掃除する予定です。",
    "solutions": [
      "I am going to clean a room tomorrow.",
      "Tomorrow, I am going to clean a room."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、部屋を掃除する予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は部屋を掃除し終えました。",
    "solutions": [
      "I finished cleaning a room."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は部屋を掃除し終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう部屋を掃除しました。",
    "solutions": [
      "I have already cleaned a room.",
      "I have cleaned a room already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう部屋を掃除しました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう部屋を掃除しましたか。",
    "solutions": [
      "Have you cleaned a room yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう部屋を掃除しましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nその部屋は私の姉によって掃除されたものです。",
    "solutions": [
      "The room was cleaned by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その部屋は私の姉によって掃除されたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日掃除した部屋です。",
    "solutions": [
      "This is the room that I cleaned yesterday.",
      "This is the room I cleaned yesterday.",
      "This is the room which I cleaned yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日掃除した部屋です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n部屋を掃除している男の子は私の弟です。",
    "solutions": [
      "The boy cleaning a room is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：部屋を掃除している男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって掃除された部屋です。",
    "solutions": [
      "This is the room cleaned by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって掃除された部屋です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・部屋",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が部屋を掃除したのか、私は知りません。",
    "solutions": [
      "I do not know why he cleaned a room.",
      "I don't know why he cleaned a room."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が部屋を掃除したのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、部屋を掃除しました。",
    "solutions": [
      "I cleaned a room before I ate dinner.",
      "Before I ate dinner, I cleaned a room."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、部屋を掃除しました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は部屋を掃除するつもりです。",
    "solutions": [
      "If I have time, I will clean a room.",
      "I will clean a room if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は部屋を掃除するつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、部屋を掃除しています。",
    "solutions": [
      "I am cleaning a room now.",
      "Now, I am cleaning a room."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、部屋を掃除しています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に部屋を掃除します。",
    "solutions": [
      "He cleans a room every Sunday.",
      "Every Sunday, he cleans a room."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に部屋を掃除します。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-007",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・部屋",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に部屋を掃除する女の子は私の友達です。",
    "solutions": [
      "The girl who cleans a room every Sunday is my friend.",
      "The girl that cleans a room every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に部屋を掃除する女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、車を洗いました。",
    "solutions": [
      "I washed a car yesterday.",
      "Yesterday, I washed a car."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、車を洗いました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、車を洗いませんでした。",
    "solutions": [
      "I did not wash a car yesterday.",
      "Yesterday, I did not wash a car.",
      "I didn't wash a car yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、車を洗いませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・車",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、車を洗いましたか。",
    "solutions": [
      "Did you wash a car yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、車を洗いましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、車を洗うつもりです。",
    "solutions": [
      "I will wash a car tomorrow.",
      "Tomorrow, I will wash a car."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、車を洗うつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は車を洗うことができます。",
    "solutions": [
      "I can wash a car."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は車を洗うことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、車を洗わなければなりません。",
    "solutions": [
      "I must wash a car today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、車を洗わなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は車を洗いたいです。",
    "solutions": [
      "I want to wash a car."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は車を洗いたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、車を洗う予定です。",
    "solutions": [
      "I am going to wash a car tomorrow.",
      "Tomorrow, I am going to wash a car."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、車を洗う予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は車を洗い終えました。",
    "solutions": [
      "I finished washing a car."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は車を洗い終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・車",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう車を洗いました。",
    "solutions": [
      "I have already washed a car.",
      "I have washed a car already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう車を洗いました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・車",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう車を洗いましたか。",
    "solutions": [
      "Have you washed a car yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう車を洗いましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・車",
    "prompt": "日本語に合う英文を作りましょう。\nその車は私の姉によって洗われたものです。",
    "solutions": [
      "The car was washed by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その車は私の姉によって洗われたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・車",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日洗った車です。",
    "solutions": [
      "This is the car that I washed yesterday.",
      "This is the car I washed yesterday.",
      "This is the car which I washed yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日洗った車です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・車",
    "prompt": "日本語に合う英文を作りましょう。\n車を洗っている男の子は私の弟です。",
    "solutions": [
      "The boy washing a car is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：車を洗っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・車",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって洗われた車です。",
    "solutions": [
      "This is the car washed by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって洗われた車です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・車",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が車を洗ったのか、私は知りません。",
    "solutions": [
      "I do not know why he washed a car.",
      "I don't know why he washed a car."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が車を洗ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、車を洗いました。",
    "solutions": [
      "I washed a car before I ate dinner.",
      "Before I ate dinner, I washed a car."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、車を洗いました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は車を洗うつもりです。",
    "solutions": [
      "If I have time, I will wash a car.",
      "I will wash a car if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は車を洗うつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・車",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、車を洗っています。",
    "solutions": [
      "I am washing a car now.",
      "Now, I am washing a car."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、車を洗っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・車",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に車を洗います。",
    "solutions": [
      "He washes a car every Sunday.",
      "Every Sunday, he washes a car."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に車を洗います。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-008",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・車",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に車を洗う女の子は私の友達です。",
    "solutions": [
      "The girl who washes a car every Sunday is my friend.",
      "The girl that washes a car every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に車を洗う女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、食事を作りました。",
    "solutions": [
      "I cooked a meal yesterday.",
      "Yesterday, I cooked a meal."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、食事を作りました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、食事を作りませんでした。",
    "solutions": [
      "I did not cook a meal yesterday.",
      "Yesterday, I did not cook a meal.",
      "I didn't cook a meal yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、食事を作りませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・食事",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、食事を作りましたか。",
    "solutions": [
      "Did you cook a meal yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、食事を作りましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、食事を作るつもりです。",
    "solutions": [
      "I will cook a meal tomorrow.",
      "Tomorrow, I will cook a meal."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、食事を作るつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は食事を作ることができます。",
    "solutions": [
      "I can cook a meal."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は食事を作ることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、食事を作らなければなりません。",
    "solutions": [
      "I must cook a meal today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、食事を作らなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は食事を作りたいです。",
    "solutions": [
      "I want to cook a meal."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は食事を作りたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、食事を作る予定です。",
    "solutions": [
      "I am going to cook a meal tomorrow.",
      "Tomorrow, I am going to cook a meal."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、食事を作る予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は食事を作り終えました。",
    "solutions": [
      "I finished cooking a meal."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は食事を作り終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう食事を作りました。",
    "solutions": [
      "I have already cooked a meal.",
      "I have cooked a meal already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう食事を作りました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・食事",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう食事を作りましたか。",
    "solutions": [
      "Have you cooked a meal yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう食事を作りましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・食事",
    "prompt": "日本語に合う英文を作りましょう。\nその食事は私の姉によって作られたものです。",
    "solutions": [
      "The meal was cooked by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その食事は私の姉によって作られたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日作った食事です。",
    "solutions": [
      "This is the meal that I cooked yesterday.",
      "This is the meal I cooked yesterday.",
      "This is the meal which I cooked yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日作った食事です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・食事",
    "prompt": "日本語に合う英文を作りましょう。\n食事を作っている男の子は私の弟です。",
    "solutions": [
      "The boy cooking a meal is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：食事を作っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・食事",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって作られた食事です。",
    "solutions": [
      "This is the meal cooked by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって作られた食事です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・食事",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が食事を作ったのか、私は知りません。",
    "solutions": [
      "I do not know why he cooked a meal.",
      "I don't know why he cooked a meal."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が食事を作ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、食事を作りました。",
    "solutions": [
      "I cooked a meal before I ate dinner.",
      "Before I ate dinner, I cooked a meal."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、食事を作りました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は食事を作るつもりです。",
    "solutions": [
      "If I have time, I will cook a meal.",
      "I will cook a meal if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は食事を作るつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・食事",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、食事を作っています。",
    "solutions": [
      "I am cooking a meal now.",
      "Now, I am cooking a meal."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、食事を作っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・食事",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に食事を作ります。",
    "solutions": [
      "He cooks a meal every Sunday.",
      "Every Sunday, he cooks a meal."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に食事を作ります。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-009",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・食事",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に食事を作る女の子は私の友達です。",
    "solutions": [
      "The girl who cooks a meal every Sunday is my friend.",
      "The girl that cooks a meal every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に食事を作る女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、壁を塗りました。",
    "solutions": [
      "I painted a wall yesterday.",
      "Yesterday, I painted a wall."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、壁を塗りました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、壁を塗りませんでした。",
    "solutions": [
      "I did not paint a wall yesterday.",
      "Yesterday, I did not paint a wall.",
      "I didn't paint a wall yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、壁を塗りませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・壁",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、壁を塗りましたか。",
    "solutions": [
      "Did you paint a wall yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、壁を塗りましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、壁を塗るつもりです。",
    "solutions": [
      "I will paint a wall tomorrow.",
      "Tomorrow, I will paint a wall."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、壁を塗るつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は壁を塗ることができます。",
    "solutions": [
      "I can paint a wall."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は壁を塗ることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、壁を塗らなければなりません。",
    "solutions": [
      "I must paint a wall today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、壁を塗らなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は壁を塗りたいです。",
    "solutions": [
      "I want to paint a wall."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は壁を塗りたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、壁を塗る予定です。",
    "solutions": [
      "I am going to paint a wall tomorrow.",
      "Tomorrow, I am going to paint a wall."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、壁を塗る予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は壁を塗り終えました。",
    "solutions": [
      "I finished painting a wall."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は壁を塗り終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう壁を塗りました。",
    "solutions": [
      "I have already painted a wall.",
      "I have painted a wall already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう壁を塗りました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・壁",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう壁を塗りましたか。",
    "solutions": [
      "Have you painted a wall yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう壁を塗りましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・壁",
    "prompt": "日本語に合う英文を作りましょう。\nその壁は私の姉によって塗られたものです。",
    "solutions": [
      "The wall was painted by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その壁は私の姉によって塗られたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日塗った壁です。",
    "solutions": [
      "This is the wall that I painted yesterday.",
      "This is the wall I painted yesterday.",
      "This is the wall which I painted yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日塗った壁です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・壁",
    "prompt": "日本語に合う英文を作りましょう。\n壁を塗っている男の子は私の弟です。",
    "solutions": [
      "The boy painting a wall is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：壁を塗っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・壁",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって塗られた壁です。",
    "solutions": [
      "This is the wall painted by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって塗られた壁です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・壁",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が壁を塗ったのか、私は知りません。",
    "solutions": [
      "I do not know why he painted a wall.",
      "I don't know why he painted a wall."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が壁を塗ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、壁を塗りました。",
    "solutions": [
      "I painted a wall before I ate dinner.",
      "Before I ate dinner, I painted a wall."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、壁を塗りました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は壁を塗るつもりです。",
    "solutions": [
      "If I have time, I will paint a wall.",
      "I will paint a wall if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は壁を塗るつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・壁",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、壁を塗っています。",
    "solutions": [
      "I am painting a wall now.",
      "Now, I am painting a wall."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、壁を塗っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・壁",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に壁を塗ります。",
    "solutions": [
      "He paints a wall every Sunday.",
      "Every Sunday, he paints a wall."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に壁を塗ります。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-010",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・壁",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に壁を塗る女の子は私の友達です。",
    "solutions": [
      "The girl who paints a wall every Sunday is my friend.",
      "The girl that paints a wall every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に壁を塗る女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、窓を開けました。",
    "solutions": [
      "I opened a window yesterday.",
      "Yesterday, I opened a window."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、窓を開けました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、窓を開けませんでした。",
    "solutions": [
      "I did not open a window yesterday.",
      "Yesterday, I did not open a window.",
      "I didn't open a window yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、窓を開けませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・窓",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、窓を開けましたか。",
    "solutions": [
      "Did you open a window yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、窓を開けましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、窓を開けるつもりです。",
    "solutions": [
      "I will open a window tomorrow.",
      "Tomorrow, I will open a window."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、窓を開けるつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は窓を開けることができます。",
    "solutions": [
      "I can open a window."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は窓を開けることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、窓を開けなければなりません。",
    "solutions": [
      "I must open a window today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、窓を開けなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は窓を開けたいです。",
    "solutions": [
      "I want to open a window."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は窓を開けたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、窓を開ける予定です。",
    "solutions": [
      "I am going to open a window tomorrow.",
      "Tomorrow, I am going to open a window."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、窓を開ける予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は窓を開け終えました。",
    "solutions": [
      "I finished opening a window."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は窓を開け終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう窓を開けました。",
    "solutions": [
      "I have already opened a window.",
      "I have opened a window already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう窓を開けました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・窓",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう窓を開けましたか。",
    "solutions": [
      "Have you opened a window yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう窓を開けましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・窓",
    "prompt": "日本語に合う英文を作りましょう。\nその窓は私の姉によって開けられたものです。",
    "solutions": [
      "The window was opened by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その窓は私の姉によって開けられたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日開けた窓です。",
    "solutions": [
      "This is the window that I opened yesterday.",
      "This is the window I opened yesterday.",
      "This is the window which I opened yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日開けた窓です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・窓",
    "prompt": "日本語に合う英文を作りましょう。\n窓を開けている男の子は私の弟です。",
    "solutions": [
      "The boy opening a window is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：窓を開けている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・窓",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって開けられた窓です。",
    "solutions": [
      "This is the window opened by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって開けられた窓です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・窓",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が窓を開けたのか、私は知りません。",
    "solutions": [
      "I do not know why he opened a window.",
      "I don't know why he opened a window."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が窓を開けたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、窓を開けました。",
    "solutions": [
      "I opened a window before I ate dinner.",
      "Before I ate dinner, I opened a window."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、窓を開けました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は窓を開けるつもりです。",
    "solutions": [
      "If I have time, I will open a window.",
      "I will open a window if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は窓を開けるつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・窓",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、窓を開けています。",
    "solutions": [
      "I am opening a window now.",
      "Now, I am opening a window."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、窓を開けています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・窓",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に窓を開けます。",
    "solutions": [
      "He opens a window every Sunday.",
      "Every Sunday, he opens a window."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に窓を開けます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-011",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・窓",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に窓を開ける女の子は私の友達です。",
    "solutions": [
      "The girl who opens a window every Sunday is my friend.",
      "The girl that opens a window every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に窓を開ける女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ドアを閉めました。",
    "solutions": [
      "I closed a door yesterday.",
      "Yesterday, I closed a door."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、ドアを閉めました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ドアを閉めませんでした。",
    "solutions": [
      "I did not close a door yesterday.",
      "Yesterday, I did not close a door.",
      "I didn't close a door yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、ドアを閉めませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、ドアを閉めましたか。",
    "solutions": [
      "Did you close a door yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、ドアを閉めましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ドアを閉めるつもりです。",
    "solutions": [
      "I will close a door tomorrow.",
      "Tomorrow, I will close a door."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、ドアを閉めるつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私はドアを閉めることができます。",
    "solutions": [
      "I can close a door."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はドアを閉めることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、ドアを閉めなければなりません。",
    "solutions": [
      "I must close a door today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、ドアを閉めなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私はドアを閉めたいです。",
    "solutions": [
      "I want to close a door."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はドアを閉めたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ドアを閉める予定です。",
    "solutions": [
      "I am going to close a door tomorrow.",
      "Tomorrow, I am going to close a door."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、ドアを閉める予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私はドアを閉め終えました。",
    "solutions": [
      "I finished closing a door."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はドアを閉め終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうドアを閉めました。",
    "solutions": [
      "I have already closed a door.",
      "I have closed a door already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうドアを閉めました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうドアを閉めましたか。",
    "solutions": [
      "Have you closed a door yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうドアを閉めましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nそのドアは私の姉によって閉められたものです。",
    "solutions": [
      "The door was closed by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのドアは私の姉によって閉められたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日閉めたドアです。",
    "solutions": [
      "This is the door that I closed yesterday.",
      "This is the door I closed yesterday.",
      "This is the door which I closed yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日閉めたドアです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nドアを閉めている男の子は私の弟です。",
    "solutions": [
      "The boy closing a door is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：ドアを閉めている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって閉められたドアです。",
    "solutions": [
      "This is the door closed by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって閉められたドアです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・ドア",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がドアを閉めたのか、私は知りません。",
    "solutions": [
      "I do not know why he closed a door.",
      "I don't know why he closed a door."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がドアを閉めたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、ドアを閉めました。",
    "solutions": [
      "I closed a door before I ate dinner.",
      "Before I ate dinner, I closed a door."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、ドアを閉めました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はドアを閉めるつもりです。",
    "solutions": [
      "If I have time, I will close a door.",
      "I will close a door if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はドアを閉めるつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、ドアを閉めています。",
    "solutions": [
      "I am closing a door now.",
      "Now, I am closing a door."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、ドアを閉めています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にドアを閉めます。",
    "solutions": [
      "He closes a door every Sunday.",
      "Every Sunday, he closes a door."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にドアを閉めます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-012",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ドア",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にドアを閉める女の子は私の友達です。",
    "solutions": [
      "The girl who closes a door every Sunday is my friend.",
      "The girl that closes a door every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にドアを閉める女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、模型を組み立てました。",
    "solutions": [
      "I built a model yesterday.",
      "Yesterday, I built a model."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、模型を組み立てました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、模型を組み立てませんでした。",
    "solutions": [
      "I did not build a model yesterday.",
      "Yesterday, I did not build a model.",
      "I didn't build a model yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、模型を組み立てませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・模型",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、模型を組み立てましたか。",
    "solutions": [
      "Did you build a model yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、模型を組み立てましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、模型を組み立てるつもりです。",
    "solutions": [
      "I will build a model tomorrow.",
      "Tomorrow, I will build a model."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、模型を組み立てるつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は模型を組み立てることができます。",
    "solutions": [
      "I can build a model."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は模型を組み立てることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、模型を組み立てなければなりません。",
    "solutions": [
      "I must build a model today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、模型を組み立てなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は模型を組み立てたいです。",
    "solutions": [
      "I want to build a model."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は模型を組み立てたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、模型を組み立てる予定です。",
    "solutions": [
      "I am going to build a model tomorrow.",
      "Tomorrow, I am going to build a model."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、模型を組み立てる予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は模型を組み立て終えました。",
    "solutions": [
      "I finished building a model."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は模型を組み立て終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう模型を組み立てました。",
    "solutions": [
      "I have already built a model.",
      "I have built a model already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう模型を組み立てました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・模型",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう模型を組み立てましたか。",
    "solutions": [
      "Have you built a model yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう模型を組み立てましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・模型",
    "prompt": "日本語に合う英文を作りましょう。\nその模型は私の姉によって組み立てられたものです。",
    "solutions": [
      "The model was built by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その模型は私の姉によって組み立てられたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日組み立てた模型です。",
    "solutions": [
      "This is the model that I built yesterday.",
      "This is the model I built yesterday.",
      "This is the model which I built yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日組み立てた模型です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・模型",
    "prompt": "日本語に合う英文を作りましょう。\n模型を組み立てている男の子は私の弟です。",
    "solutions": [
      "The boy building a model is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：模型を組み立てている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・模型",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって組み立てられた模型です。",
    "solutions": [
      "This is the model built by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって組み立てられた模型です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・模型",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が模型を組み立てたのか、私は知りません。",
    "solutions": [
      "I do not know why he built a model.",
      "I don't know why he built a model."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が模型を組み立てたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、模型を組み立てました。",
    "solutions": [
      "I built a model before I ate dinner.",
      "Before I ate dinner, I built a model."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、模型を組み立てました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は模型を組み立てるつもりです。",
    "solutions": [
      "If I have time, I will build a model.",
      "I will build a model if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は模型を組み立てるつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・模型",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、模型を組み立てています。",
    "solutions": [
      "I am building a model now.",
      "Now, I am building a model."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、模型を組み立てています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・模型",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に模型を組み立てます。",
    "solutions": [
      "He builds a model every Sunday.",
      "Every Sunday, he builds a model."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に模型を組み立てます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-013",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・模型",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に模型を組み立てる女の子は私の友達です。",
    "solutions": [
      "The girl who builds a model every Sunday is my friend.",
      "The girl that builds a model every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に模型を組み立てる女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、自転車を修理しました。",
    "solutions": [
      "I repaired a bicycle yesterday.",
      "Yesterday, I repaired a bicycle."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、自転車を修理しました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、自転車を修理しませんでした。",
    "solutions": [
      "I did not repair a bicycle yesterday.",
      "Yesterday, I did not repair a bicycle.",
      "I didn't repair a bicycle yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、自転車を修理しませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、自転車を修理しましたか。",
    "solutions": [
      "Did you repair a bicycle yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、自転車を修理しましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、自転車を修理するつもりです。",
    "solutions": [
      "I will repair a bicycle tomorrow.",
      "Tomorrow, I will repair a bicycle."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、自転車を修理するつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は自転車を修理することができます。",
    "solutions": [
      "I can repair a bicycle."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は自転車を修理することができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、自転車を修理しなければなりません。",
    "solutions": [
      "I must repair a bicycle today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、自転車を修理しなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は自転車を修理したいです。",
    "solutions": [
      "I want to repair a bicycle."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は自転車を修理したいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、自転車を修理する予定です。",
    "solutions": [
      "I am going to repair a bicycle tomorrow.",
      "Tomorrow, I am going to repair a bicycle."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、自転車を修理する予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は自転車を修理し終えました。",
    "solutions": [
      "I finished repairing a bicycle."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は自転車を修理し終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう自転車を修理しました。",
    "solutions": [
      "I have already repaired a bicycle.",
      "I have repaired a bicycle already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう自転車を修理しました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう自転車を修理しましたか。",
    "solutions": [
      "Have you repaired a bicycle yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう自転車を修理しましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nその自転車は私の姉によって修理されたものです。",
    "solutions": [
      "The bicycle was repaired by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その自転車は私の姉によって修理されたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日修理した自転車です。",
    "solutions": [
      "This is the bicycle that I repaired yesterday.",
      "This is the bicycle I repaired yesterday.",
      "This is the bicycle which I repaired yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日修理した自転車です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n自転車を修理している男の子は私の弟です。",
    "solutions": [
      "The boy repairing a bicycle is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：自転車を修理している男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって修理された自転車です。",
    "solutions": [
      "This is the bicycle repaired by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって修理された自転車です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・自転車",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が自転車を修理したのか、私は知りません。",
    "solutions": [
      "I do not know why he repaired a bicycle.",
      "I don't know why he repaired a bicycle."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が自転車を修理したのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、自転車を修理しました。",
    "solutions": [
      "I repaired a bicycle before I ate dinner.",
      "Before I ate dinner, I repaired a bicycle."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、自転車を修理しました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は自転車を修理するつもりです。",
    "solutions": [
      "If I have time, I will repair a bicycle.",
      "I will repair a bicycle if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は自転車を修理するつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、自転車を修理しています。",
    "solutions": [
      "I am repairing a bicycle now.",
      "Now, I am repairing a bicycle."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、自転車を修理しています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に自転車を修理します。",
    "solutions": [
      "He repairs a bicycle every Sunday.",
      "Every Sunday, he repairs a bicycle."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に自転車を修理します。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-014",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・自転車",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に自転車を修理する女の子は私の友達です。",
    "solutions": [
      "The girl who repairs a bicycle every Sunday is my friend.",
      "The girl that repairs a bicycle every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に自転車を修理する女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ノートを買いました。",
    "solutions": [
      "I bought a notebook yesterday.",
      "Yesterday, I bought a notebook."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、ノートを買いました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ノートを買いませんでした。",
    "solutions": [
      "I did not buy a notebook yesterday.",
      "Yesterday, I did not buy a notebook.",
      "I didn't buy a notebook yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、ノートを買いませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、ノートを買いましたか。",
    "solutions": [
      "Did you buy a notebook yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、ノートを買いましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ノートを買うつもりです。",
    "solutions": [
      "I will buy a notebook tomorrow.",
      "Tomorrow, I will buy a notebook."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、ノートを買うつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私はノートを買うことができます。",
    "solutions": [
      "I can buy a notebook."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はノートを買うことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、ノートを買わなければなりません。",
    "solutions": [
      "I must buy a notebook today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、ノートを買わなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私はノートを買いたいです。",
    "solutions": [
      "I want to buy a notebook."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はノートを買いたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ノートを買う予定です。",
    "solutions": [
      "I am going to buy a notebook tomorrow.",
      "Tomorrow, I am going to buy a notebook."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、ノートを買う予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私はノートを買い終えました。",
    "solutions": [
      "I finished buying a notebook."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はノートを買い終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうノートを買いました。",
    "solutions": [
      "I have already bought a notebook.",
      "I have bought a notebook already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうノートを買いました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうノートを買いましたか。",
    "solutions": [
      "Have you bought a notebook yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうノートを買いましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nそのノートは私の姉によって買われたものです。",
    "solutions": [
      "The notebook was bought by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのノートは私の姉によって買われたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日買ったノートです。",
    "solutions": [
      "This is the notebook that I bought yesterday.",
      "This is the notebook I bought yesterday.",
      "This is the notebook which I bought yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日買ったノートです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nノートを買っている男の子は私の弟です。",
    "solutions": [
      "The boy buying a notebook is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：ノートを買っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって買われたノートです。",
    "solutions": [
      "This is the notebook bought by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって買われたノートです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・ノート",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がノートを買ったのか、私は知りません。",
    "solutions": [
      "I do not know why he bought a notebook.",
      "I don't know why he bought a notebook."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がノートを買ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、ノートを買いました。",
    "solutions": [
      "I bought a notebook before I ate dinner.",
      "Before I ate dinner, I bought a notebook."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、ノートを買いました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はノートを買うつもりです。",
    "solutions": [
      "If I have time, I will buy a notebook.",
      "I will buy a notebook if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はノートを買うつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、ノートを買っています。",
    "solutions": [
      "I am buying a notebook now.",
      "Now, I am buying a notebook."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、ノートを買っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にノートを買います。",
    "solutions": [
      "He buys a notebook every Sunday.",
      "Every Sunday, he buys a notebook."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にノートを買います。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-015",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ノート",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にノートを買う女の子は私の友達です。",
    "solutions": [
      "The girl who buys a notebook every Sunday is my friend.",
      "The girl that buys a notebook every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にノートを買う女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、コンピューターを使いました。",
    "solutions": [
      "I used a computer yesterday.",
      "Yesterday, I used a computer."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、コンピューターを使いました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、コンピューターを使いませんでした。",
    "solutions": [
      "I did not use a computer yesterday.",
      "Yesterday, I did not use a computer.",
      "I didn't use a computer yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、コンピューターを使いませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、コンピューターを使いましたか。",
    "solutions": [
      "Did you use a computer yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、コンピューターを使いましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、コンピューターを使うつもりです。",
    "solutions": [
      "I will use a computer tomorrow.",
      "Tomorrow, I will use a computer."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、コンピューターを使うつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私はコンピューターを使うことができます。",
    "solutions": [
      "I can use a computer."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はコンピューターを使うことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、コンピューターを使わなければなりません。",
    "solutions": [
      "I must use a computer today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、コンピューターを使わなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私はコンピューターを使いたいです。",
    "solutions": [
      "I want to use a computer."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はコンピューターを使いたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、コンピューターを使う予定です。",
    "solutions": [
      "I am going to use a computer tomorrow.",
      "Tomorrow, I am going to use a computer."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、コンピューターを使う予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私はコンピューターを使い終えました。",
    "solutions": [
      "I finished using a computer."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はコンピューターを使い終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうコンピューターを使いました。",
    "solutions": [
      "I have already used a computer.",
      "I have used a computer already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうコンピューターを使いました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうコンピューターを使いましたか。",
    "solutions": [
      "Have you used a computer yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうコンピューターを使いましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nそのコンピューターは私の姉によって使われたものです。",
    "solutions": [
      "The computer was used by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのコンピューターは私の姉によって使われたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日使ったコンピューターです。",
    "solutions": [
      "This is the computer that I used yesterday.",
      "This is the computer I used yesterday.",
      "This is the computer which I used yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日使ったコンピューターです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nコンピューターを使っている男の子は私の弟です。",
    "solutions": [
      "The boy using a computer is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：コンピューターを使っている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって使われたコンピューターです。",
    "solutions": [
      "This is the computer used by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって使われたコンピューターです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がコンピューターを使ったのか、私は知りません。",
    "solutions": [
      "I do not know why he used a computer.",
      "I don't know why he used a computer."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がコンピューターを使ったのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、コンピューターを使いました。",
    "solutions": [
      "I used a computer before I ate dinner.",
      "Before I ate dinner, I used a computer."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、コンピューターを使いました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はコンピューターを使うつもりです。",
    "solutions": [
      "If I have time, I will use a computer.",
      "I will use a computer if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はコンピューターを使うつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、コンピューターを使っています。",
    "solutions": [
      "I am using a computer now.",
      "Now, I am using a computer."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、コンピューターを使っています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にコンピューターを使います。",
    "solutions": [
      "He uses a computer every Sunday.",
      "Every Sunday, he uses a computer."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にコンピューターを使います。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-016",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・コンピューター",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にコンピューターを使う女の子は私の友達です。",
    "solutions": [
      "The girl who uses a computer every Sunday is my friend.",
      "The girl that uses a computer every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にコンピューターを使う女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、箱を運びました。",
    "solutions": [
      "I carried a box yesterday.",
      "Yesterday, I carried a box."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、箱を運びました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、箱を運びませんでした。",
    "solutions": [
      "I did not carry a box yesterday.",
      "Yesterday, I did not carry a box.",
      "I didn't carry a box yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、箱を運びませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・箱",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、箱を運びましたか。",
    "solutions": [
      "Did you carry a box yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、箱を運びましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、箱を運ぶつもりです。",
    "solutions": [
      "I will carry a box tomorrow.",
      "Tomorrow, I will carry a box."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、箱を運ぶつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は箱を運ぶことができます。",
    "solutions": [
      "I can carry a box."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は箱を運ぶことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、箱を運ばなければなりません。",
    "solutions": [
      "I must carry a box today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、箱を運ばなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は箱を運びたいです。",
    "solutions": [
      "I want to carry a box."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は箱を運びたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、箱を運ぶ予定です。",
    "solutions": [
      "I am going to carry a box tomorrow.",
      "Tomorrow, I am going to carry a box."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、箱を運ぶ予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は箱を運び終えました。",
    "solutions": [
      "I finished carrying a box."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は箱を運び終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう箱を運びました。",
    "solutions": [
      "I have already carried a box.",
      "I have carried a box already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう箱を運びました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・箱",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう箱を運びましたか。",
    "solutions": [
      "Have you carried a box yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう箱を運びましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・箱",
    "prompt": "日本語に合う英文を作りましょう。\nその箱は私の姉によって運ばれたものです。",
    "solutions": [
      "The box was carried by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その箱は私の姉によって運ばれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日運んだ箱です。",
    "solutions": [
      "This is the box that I carried yesterday.",
      "This is the box I carried yesterday.",
      "This is the box which I carried yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日運んだ箱です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・箱",
    "prompt": "日本語に合う英文を作りましょう。\n箱を運んでいる男の子は私の弟です。",
    "solutions": [
      "The boy carrying a box is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：箱を運んでいる男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・箱",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって運ばれた箱です。",
    "solutions": [
      "This is the box carried by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって運ばれた箱です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・箱",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が箱を運んだのか、私は知りません。",
    "solutions": [
      "I do not know why he carried a box.",
      "I don't know why he carried a box."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が箱を運んだのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、箱を運びました。",
    "solutions": [
      "I carried a box before I ate dinner.",
      "Before I ate dinner, I carried a box."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、箱を運びました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は箱を運ぶつもりです。",
    "solutions": [
      "If I have time, I will carry a box.",
      "I will carry a box if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は箱を運ぶつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・箱",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、箱を運んでいます。",
    "solutions": [
      "I am carrying a box now.",
      "Now, I am carrying a box."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、箱を運んでいます。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・箱",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に箱を運びます。",
    "solutions": [
      "He carries a box every Sunday.",
      "Every Sunday, he carries a box."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に箱を運びます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-017",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・箱",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に箱を運ぶ女の子は私の友達です。",
    "solutions": [
      "The girl who carries a box every Sunday is my friend.",
      "The girl that carries a box every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に箱を運ぶ女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、いすを動かしました。",
    "solutions": [
      "I moved a chair yesterday.",
      "Yesterday, I moved a chair."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、いすを動かしました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、いすを動かしませんでした。",
    "solutions": [
      "I did not move a chair yesterday.",
      "Yesterday, I did not move a chair.",
      "I didn't move a chair yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、いすを動かしませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・いす",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、いすを動かしましたか。",
    "solutions": [
      "Did you move a chair yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、いすを動かしましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、いすを動かすつもりです。",
    "solutions": [
      "I will move a chair tomorrow.",
      "Tomorrow, I will move a chair."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、いすを動かすつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私はいすを動かすことができます。",
    "solutions": [
      "I can move a chair."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はいすを動かすことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、いすを動かさなければなりません。",
    "solutions": [
      "I must move a chair today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、いすを動かさなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私はいすを動かしたいです。",
    "solutions": [
      "I want to move a chair."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はいすを動かしたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、いすを動かす予定です。",
    "solutions": [
      "I am going to move a chair tomorrow.",
      "Tomorrow, I am going to move a chair."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、いすを動かす予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私はいすを動かし終えました。",
    "solutions": [
      "I finished moving a chair."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はいすを動かし終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私はもういすを動かしました。",
    "solutions": [
      "I have already moved a chair.",
      "I have moved a chair already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもういすを動かしました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・いす",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもういすを動かしましたか。",
    "solutions": [
      "Have you moved a chair yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもういすを動かしましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・いす",
    "prompt": "日本語に合う英文を作りましょう。\nそのいすは私の姉によって動かされたものです。",
    "solutions": [
      "The chair was moved by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのいすは私の姉によって動かされたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日動かしたいすです。",
    "solutions": [
      "This is the chair that I moved yesterday.",
      "This is the chair I moved yesterday.",
      "This is the chair which I moved yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日動かしたいすです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・いす",
    "prompt": "日本語に合う英文を作りましょう。\nいすを動かしている男の子は私の弟です。",
    "solutions": [
      "The boy moving a chair is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：いすを動かしている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・いす",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって動かされたいすです。",
    "solutions": [
      "This is the chair moved by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって動かされたいすです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・いす",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がいすを動かしたのか、私は知りません。",
    "solutions": [
      "I do not know why he moved a chair.",
      "I don't know why he moved a chair."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がいすを動かしたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、いすを動かしました。",
    "solutions": [
      "I moved a chair before I ate dinner.",
      "Before I ate dinner, I moved a chair."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、いすを動かしました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はいすを動かすつもりです。",
    "solutions": [
      "If I have time, I will move a chair.",
      "I will move a chair if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はいすを動かすつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・いす",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、いすを動かしています。",
    "solutions": [
      "I am moving a chair now.",
      "Now, I am moving a chair."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、いすを動かしています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・いす",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にいすを動かします。",
    "solutions": [
      "He moves a chair every Sunday.",
      "Every Sunday, he moves a chair."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にいすを動かします。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-018",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・いす",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にいすを動かす女の子は私の友達です。",
    "solutions": [
      "The girl who moves a chair every Sunday is my friend.",
      "The girl that moves a chair every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にいすを動かす女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、贈り物を選びました。",
    "solutions": [
      "I chose a gift yesterday.",
      "Yesterday, I chose a gift."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、贈り物を選びました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、贈り物を選びませんでした。",
    "solutions": [
      "I did not choose a gift yesterday.",
      "Yesterday, I did not choose a gift.",
      "I didn't choose a gift yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、贈り物を選びませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、贈り物を選びましたか。",
    "solutions": [
      "Did you choose a gift yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、贈り物を選びましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、贈り物を選ぶつもりです。",
    "solutions": [
      "I will choose a gift tomorrow.",
      "Tomorrow, I will choose a gift."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、贈り物を選ぶつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は贈り物を選ぶことができます。",
    "solutions": [
      "I can choose a gift."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は贈り物を選ぶことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、贈り物を選ばなければなりません。",
    "solutions": [
      "I must choose a gift today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、贈り物を選ばなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は贈り物を選びたいです。",
    "solutions": [
      "I want to choose a gift."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は贈り物を選びたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、贈り物を選ぶ予定です。",
    "solutions": [
      "I am going to choose a gift tomorrow.",
      "Tomorrow, I am going to choose a gift."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、贈り物を選ぶ予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は贈り物を選び終えました。",
    "solutions": [
      "I finished choosing a gift."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は贈り物を選び終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう贈り物を選びました。",
    "solutions": [
      "I have already chosen a gift.",
      "I have chosen a gift already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう贈り物を選びました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう贈り物を選びましたか。",
    "solutions": [
      "Have you chosen a gift yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう贈り物を選びましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nその贈り物は私の姉によって選ばれたものです。",
    "solutions": [
      "The gift was chosen by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その贈り物は私の姉によって選ばれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日選んだ贈り物です。",
    "solutions": [
      "This is the gift that I chose yesterday.",
      "This is the gift I chose yesterday.",
      "This is the gift which I chose yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日選んだ贈り物です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n贈り物を選んでいる男の子は私の弟です。",
    "solutions": [
      "The boy choosing a gift is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：贈り物を選んでいる男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって選ばれた贈り物です。",
    "solutions": [
      "This is the gift chosen by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって選ばれた贈り物です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が贈り物を選んだのか、私は知りません。",
    "solutions": [
      "I do not know why he chose a gift.",
      "I don't know why he chose a gift."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が贈り物を選んだのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、贈り物を選びました。",
    "solutions": [
      "I chose a gift before I ate dinner.",
      "Before I ate dinner, I chose a gift."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、贈り物を選びました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は贈り物を選ぶつもりです。",
    "solutions": [
      "If I have time, I will choose a gift.",
      "I will choose a gift if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は贈り物を選ぶつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、贈り物を選んでいます。",
    "solutions": [
      "I am choosing a gift now.",
      "Now, I am choosing a gift."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、贈り物を選んでいます。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に贈り物を選びます。",
    "solutions": [
      "He chooses a gift every Sunday.",
      "Every Sunday, he chooses a gift."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に贈り物を選びます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-019",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・贈り物",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に贈り物を選ぶ女の子は私の友達です。",
    "solutions": [
      "The girl who chooses a gift every Sunday is my friend.",
      "The girl that chooses a gift every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に贈り物を選ぶ女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ポスターをデザインしました。",
    "solutions": [
      "I designed a poster yesterday.",
      "Yesterday, I designed a poster."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、ポスターをデザインしました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、ポスターをデザインしませんでした。",
    "solutions": [
      "I did not design a poster yesterday.",
      "Yesterday, I did not design a poster.",
      "I didn't design a poster yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、ポスターをデザインしませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、ポスターをデザインしましたか。",
    "solutions": [
      "Did you design a poster yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、ポスターをデザインしましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ポスターをデザインするつもりです。",
    "solutions": [
      "I will design a poster tomorrow.",
      "Tomorrow, I will design a poster."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、ポスターをデザインするつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私はポスターをデザインすることができます。",
    "solutions": [
      "I can design a poster."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はポスターをデザインすることができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、ポスターをデザインしなければなりません。",
    "solutions": [
      "I must design a poster today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、ポスターをデザインしなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私はポスターをデザインしたいです。",
    "solutions": [
      "I want to design a poster."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はポスターをデザインしたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、ポスターをデザインする予定です。",
    "solutions": [
      "I am going to design a poster tomorrow.",
      "Tomorrow, I am going to design a poster."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、ポスターをデザインする予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私はポスターをデザインし終えました。",
    "solutions": [
      "I finished designing a poster."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はポスターをデザインし終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうポスターをデザインしました。",
    "solutions": [
      "I have already designed a poster.",
      "I have designed a poster already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうポスターをデザインしました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうポスターをデザインしましたか。",
    "solutions": [
      "Have you designed a poster yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうポスターをデザインしましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nそのポスターは私の姉によってデザインされたものです。",
    "solutions": [
      "The poster was designed by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのポスターは私の姉によってデザインされたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日デザインしたポスターです。",
    "solutions": [
      "This is the poster that I designed yesterday.",
      "This is the poster I designed yesterday.",
      "This is the poster which I designed yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日デザインしたポスターです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nポスターをデザインしている男の子は私の弟です。",
    "solutions": [
      "The boy designing a poster is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：ポスターをデザインしている男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によってデザインされたポスターです。",
    "solutions": [
      "This is the poster designed by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によってデザインされたポスターです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がポスターをデザインしたのか、私は知りません。",
    "solutions": [
      "I do not know why he designed a poster.",
      "I don't know why he designed a poster."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がポスターをデザインしたのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、ポスターをデザインしました。",
    "solutions": [
      "I designed a poster before I ate dinner.",
      "Before I ate dinner, I designed a poster."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、ポスターをデザインしました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はポスターをデザインするつもりです。",
    "solutions": [
      "If I have time, I will design a poster.",
      "I will design a poster if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はポスターをデザインするつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、ポスターをデザインしています。",
    "solutions": [
      "I am designing a poster now.",
      "Now, I am designing a poster."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、ポスターをデザインしています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にポスターをデザインします。",
    "solutions": [
      "He designs a poster every Sunday.",
      "Every Sunday, he designs a poster."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にポスターをデザインします。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-020",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・ポスター",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にポスターをデザインする女の子は私の友達です。",
    "solutions": [
      "The girl who designs a poster every Sunday is my friend.",
      "The girl that designs a poster every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にポスターをデザインする女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、歌を練習しました。",
    "solutions": [
      "I practiced a song yesterday.",
      "Yesterday, I practiced a song."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、歌を練習しました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、歌を練習しませんでした。",
    "solutions": [
      "I did not practice a song yesterday.",
      "Yesterday, I did not practice a song.",
      "I didn't practice a song yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、歌を練習しませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・歌",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、歌を練習しましたか。",
    "solutions": [
      "Did you practice a song yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、歌を練習しましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、歌を練習するつもりです。",
    "solutions": [
      "I will practice a song tomorrow.",
      "Tomorrow, I will practice a song."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、歌を練習するつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は歌を練習することができます。",
    "solutions": [
      "I can practice a song."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は歌を練習することができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、歌を練習しなければなりません。",
    "solutions": [
      "I must practice a song today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、歌を練習しなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は歌を練習したいです。",
    "solutions": [
      "I want to practice a song."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は歌を練習したいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、歌を練習する予定です。",
    "solutions": [
      "I am going to practice a song tomorrow.",
      "Tomorrow, I am going to practice a song."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、歌を練習する予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は歌を練習し終えました。",
    "solutions": [
      "I finished practicing a song."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は歌を練習し終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう歌を練習しました。",
    "solutions": [
      "I have already practiced a song.",
      "I have practiced a song already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう歌を練習しました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・歌",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう歌を練習しましたか。",
    "solutions": [
      "Have you practiced a song yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう歌を練習しましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・歌",
    "prompt": "日本語に合う英文を作りましょう。\nその歌は私の姉によって練習されたものです。",
    "solutions": [
      "The song was practiced by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その歌は私の姉によって練習されたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日練習した歌です。",
    "solutions": [
      "This is the song that I practiced yesterday.",
      "This is the song I practiced yesterday.",
      "This is the song which I practiced yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日練習した歌です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・歌",
    "prompt": "日本語に合う英文を作りましょう。\n歌を練習している男の子は私の弟です。",
    "solutions": [
      "The boy practicing a song is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：歌を練習している男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・歌",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって練習された歌です。",
    "solutions": [
      "This is the song practiced by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって練習された歌です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・歌",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が歌を練習したのか、私は知りません。",
    "solutions": [
      "I do not know why he practiced a song.",
      "I don't know why he practiced a song."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が歌を練習したのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、歌を練習しました。",
    "solutions": [
      "I practiced a song before I ate dinner.",
      "Before I ate dinner, I practiced a song."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、歌を練習しました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は歌を練習するつもりです。",
    "solutions": [
      "If I have time, I will practice a song.",
      "I will practice a song if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は歌を練習するつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・歌",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、歌を練習しています。",
    "solutions": [
      "I am practicing a song now.",
      "Now, I am practicing a song."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、歌を練習しています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・歌",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に歌を練習します。",
    "solutions": [
      "He practices a song every Sunday.",
      "Every Sunday, he practices a song."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に歌を練習します。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-021",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・歌",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に歌を練習する女の子は私の友達です。",
    "solutions": [
      "The girl who practices a song every Sunday is my friend.",
      "The girl that practices a song every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に歌を練習する女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、文を翻訳しました。",
    "solutions": [
      "I translated a sentence yesterday.",
      "Yesterday, I translated a sentence."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、文を翻訳しました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、文を翻訳しませんでした。",
    "solutions": [
      "I did not translate a sentence yesterday.",
      "Yesterday, I did not translate a sentence.",
      "I didn't translate a sentence yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、文を翻訳しませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・文",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、文を翻訳しましたか。",
    "solutions": [
      "Did you translate a sentence yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、文を翻訳しましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、文を翻訳するつもりです。",
    "solutions": [
      "I will translate a sentence tomorrow.",
      "Tomorrow, I will translate a sentence."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、文を翻訳するつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は文を翻訳することができます。",
    "solutions": [
      "I can translate a sentence."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は文を翻訳することができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、文を翻訳しなければなりません。",
    "solutions": [
      "I must translate a sentence today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、文を翻訳しなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は文を翻訳したいです。",
    "solutions": [
      "I want to translate a sentence."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は文を翻訳したいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、文を翻訳する予定です。",
    "solutions": [
      "I am going to translate a sentence tomorrow.",
      "Tomorrow, I am going to translate a sentence."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、文を翻訳する予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は文を翻訳し終えました。",
    "solutions": [
      "I finished translating a sentence."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は文を翻訳し終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・文",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう文を翻訳しました。",
    "solutions": [
      "I have already translated a sentence.",
      "I have translated a sentence already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう文を翻訳しました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・文",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう文を翻訳しましたか。",
    "solutions": [
      "Have you translated a sentence yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう文を翻訳しましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・文",
    "prompt": "日本語に合う英文を作りましょう。\nその文は私の姉によって翻訳されたものです。",
    "solutions": [
      "The sentence was translated by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その文は私の姉によって翻訳されたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・文",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日翻訳した文です。",
    "solutions": [
      "This is the sentence that I translated yesterday.",
      "This is the sentence I translated yesterday.",
      "This is the sentence which I translated yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日翻訳した文です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・文",
    "prompt": "日本語に合う英文を作りましょう。\n文を翻訳している男の子は私の弟です。",
    "solutions": [
      "The boy translating a sentence is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：文を翻訳している男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・文",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって翻訳された文です。",
    "solutions": [
      "This is the sentence translated by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって翻訳された文です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・文",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が文を翻訳したのか、私は知りません。",
    "solutions": [
      "I do not know why he translated a sentence.",
      "I don't know why he translated a sentence."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が文を翻訳したのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、文を翻訳しました。",
    "solutions": [
      "I translated a sentence before I ate dinner.",
      "Before I ate dinner, I translated a sentence."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、文を翻訳しました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は文を翻訳するつもりです。",
    "solutions": [
      "If I have time, I will translate a sentence.",
      "I will translate a sentence if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は文を翻訳するつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・文",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、文を翻訳しています。",
    "solutions": [
      "I am translating a sentence now.",
      "Now, I am translating a sentence."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、文を翻訳しています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・文",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に文を翻訳します。",
    "solutions": [
      "He translates a sentence every Sunday.",
      "Every Sunday, he translates a sentence."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に文を翻訳します。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-022",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・文",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に文を翻訳する女の子は私の友達です。",
    "solutions": [
      "The girl who translates a sentence every Sunday is my friend.",
      "The girl that translates a sentence every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に文を翻訳する女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、地図を確認しました。",
    "solutions": [
      "I checked a map yesterday.",
      "Yesterday, I checked a map."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、地図を確認しました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、地図を確認しませんでした。",
    "solutions": [
      "I did not check a map yesterday.",
      "Yesterday, I did not check a map.",
      "I didn't check a map yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、地図を確認しませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・地図",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、地図を確認しましたか。",
    "solutions": [
      "Did you check a map yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、地図を確認しましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、地図を確認するつもりです。",
    "solutions": [
      "I will check a map tomorrow.",
      "Tomorrow, I will check a map."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、地図を確認するつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は地図を確認することができます。",
    "solutions": [
      "I can check a map."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私は地図を確認することができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、地図を確認しなければなりません。",
    "solutions": [
      "I must check a map today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、地図を確認しなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は地図を確認したいです。",
    "solutions": [
      "I want to check a map."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私は地図を確認したいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、地図を確認する予定です。",
    "solutions": [
      "I am going to check a map tomorrow.",
      "Tomorrow, I am going to check a map."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、地図を確認する予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は地図を確認し終えました。",
    "solutions": [
      "I finished checking a map."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私は地図を確認し終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私はもう地図を確認しました。",
    "solutions": [
      "I have already checked a map.",
      "I have checked a map already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもう地図を確認しました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・地図",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもう地図を確認しましたか。",
    "solutions": [
      "Have you checked a map yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもう地図を確認しましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・地図",
    "prompt": "日本語に合う英文を作りましょう。\nその地図は私の姉によって確認されたものです。",
    "solutions": [
      "The map was checked by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：その地図は私の姉によって確認されたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日確認した地図です。",
    "solutions": [
      "This is the map that I checked yesterday.",
      "This is the map I checked yesterday.",
      "This is the map which I checked yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日確認した地図です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・地図",
    "prompt": "日本語に合う英文を作りましょう。\n地図を確認している男の子は私の弟です。",
    "solutions": [
      "The boy checking a map is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：地図を確認している男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・地図",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって確認された地図です。",
    "solutions": [
      "This is the map checked by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって確認された地図です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・地図",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼が地図を確認したのか、私は知りません。",
    "solutions": [
      "I do not know why he checked a map.",
      "I don't know why he checked a map."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼が地図を確認したのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、地図を確認しました。",
    "solutions": [
      "I checked a map before I ate dinner.",
      "Before I ate dinner, I checked a map."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、地図を確認しました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私は地図を確認するつもりです。",
    "solutions": [
      "If I have time, I will check a map.",
      "I will check a map if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私は地図を確認するつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・地図",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、地図を確認しています。",
    "solutions": [
      "I am checking a map now.",
      "Now, I am checking a map."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、地図を確認しています。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・地図",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日に地図を確認します。",
    "solutions": [
      "He checks a map every Sunday.",
      "Every Sunday, he checks a map."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日に地図を確認します。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-023",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・地図",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日に地図を確認する女の子は私の友達です。",
    "solutions": [
      "The girl who checks a map every Sunday is my friend.",
      "The girl that checks a map every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日に地図を確認する女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-01-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、タオルを畳みました。",
    "solutions": [
      "I folded a towel yesterday.",
      "Yesterday, I folded a towel."
    ],
    "advice": "過去の出来事は動詞の過去形を使います。\n和訳：私は昨日、タオルを畳みました。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-02-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は昨日、タオルを畳みませんでした。",
    "solutions": [
      "I did not fold a towel yesterday.",
      "Yesterday, I did not fold a towel.",
      "I didn't fold a towel yesterday."
    ],
    "advice": "did not の後は動詞の原形です。\n和訳：私は昨日、タオルを畳みませんでした。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-03-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "過去形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nあなたは昨日、タオルを畳みましたか。",
    "solutions": [
      "Did you fold a towel yesterday?"
    ],
    "advice": "Did＋主語＋動詞の原形の順にします。\n和訳：あなたは昨日、タオルを畳みましたか。",
    "grade": "中学1年",
    "unit": "過去形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-04-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、タオルを畳むつもりです。",
    "solutions": [
      "I will fold a towel tomorrow.",
      "Tomorrow, I will fold a towel."
    ],
    "advice": "will の後は動詞の原形です。tomorrow は未来を表します。\n和訳：私は明日、タオルを畳むつもりです。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-05-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私はタオルを畳むことができます。",
    "solutions": [
      "I can fold a towel."
    ],
    "advice": "can は「〜できる」。can の後は動詞の原形です。\n和訳：私はタオルを畳むことができます。",
    "grade": "中学1年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-06-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "助動詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は今日、タオルを畳まなければなりません。",
    "solutions": [
      "I must fold a towel today."
    ],
    "advice": "must は必要・義務を表します。後には動詞の原形を置きます。\n和訳：私は今日、タオルを畳まなければなりません。",
    "grade": "中学2年",
    "unit": "助動詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-07-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "不定詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私はタオルを畳みたいです。",
    "solutions": [
      "I want to fold a towel."
    ],
    "advice": "want to＋動詞の原形で「〜したい」です。\n和訳：私はタオルを畳みたいです。",
    "grade": "中学2年",
    "unit": "不定詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-08-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "未来表現・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は明日、タオルを畳む予定です。",
    "solutions": [
      "I am going to fold a towel tomorrow.",
      "Tomorrow, I am going to fold a towel."
    ],
    "advice": "be going to＋動詞の原形で予定を表します。I に合わせて am を使います。\n和訳：私は明日、タオルを畳む予定です。",
    "grade": "中学2年",
    "unit": "未来表現",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-09-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "動名詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私はタオルを畳み終えました。",
    "solutions": [
      "I finished folding a towel."
    ],
    "advice": "finish の目的語には動名詞（動詞のing形）を置きます。\n和訳：私はタオルを畳み終えました。",
    "grade": "中学2年",
    "unit": "動名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-10-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私はもうタオルを畳みました。",
    "solutions": [
      "I have already folded a towel.",
      "I have folded a towel already."
    ],
    "advice": "完了を表す have＋過去分詞。already は have と過去分詞の間に置く形を練習します。\n和訳：私はもうタオルを畳みました。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-11-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "現在完了・完了進行形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nあなたはもうタオルを畳みましたか。",
    "solutions": [
      "Have you folded a towel yet?"
    ],
    "advice": "完了を尋ねる Have＋主語＋過去分詞。yet は疑問文の末尾に置きます。\n和訳：あなたはもうタオルを畳みましたか。",
    "grade": "中学3年",
    "unit": "現在完了・完了進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-12-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "受け身・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nそのタオルは私の姉によって畳まれたものです。",
    "solutions": [
      "The towel was folded by my sister."
    ],
    "advice": "過去の受け身は was / were＋過去分詞。ここでは単数の物が主語なので was を使います。\n和訳：そのタオルは私の姉によって畳まれたものです。",
    "grade": "中学2年",
    "unit": "受け身",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-13-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私が昨日畳んだタオルです。",
    "solutions": [
      "This is the towel that I folded yesterday.",
      "This is the towel I folded yesterday.",
      "This is the towel which I folded yesterday."
    ],
    "advice": "that 以下が直前の名詞を説明します。目的格の that は省略しても同じ意味になります。\n和訳：これは私が昨日畳んだタオルです。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-14-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nタオルを畳んでいる男の子は私の弟です。",
    "solutions": [
      "The boy folding a towel is my brother."
    ],
    "advice": "名詞 the boy の後ろから現在分詞のまとまりで説明します。文の中心の動詞は is です。\n和訳：タオルを畳んでいる男の子は私の弟です。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-15-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "分詞の後置修飾・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nこれは私の姉によって畳まれたタオルです。",
    "solutions": [
      "This is the towel folded by my sister."
    ],
    "advice": "名詞の後ろに過去分詞＋by ... を置き、「〜によって…された」と説明します。\n和訳：これは私の姉によって畳まれたタオルです。",
    "grade": "中学3年",
    "unit": "分詞の後置修飾",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-16-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "間接疑問・文型・タオル",
    "prompt": "日本語に合う英文を作りましょう。\nなぜ彼がタオルを畳んだのか、私は知りません。",
    "solutions": [
      "I do not know why he folded a towel.",
      "I don't know why he folded a towel."
    ],
    "advice": "間接疑問は why＋主語＋動詞の語順です。why の後を疑問文の語順にしません。\n和訳：なぜ彼がタオルを畳んだのか、私は知りません。",
    "grade": "中学3年",
    "unit": "間接疑問・文型",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-17-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は夕食を食べる前に、タオルを畳みました。",
    "solutions": [
      "I folded a towel before I ate dinner.",
      "Before I ate dinner, I folded a towel."
    ],
    "advice": "before＋主語＋動詞で「〜する前に」。2つの出来事の順を確かめましょう。\n和訳：私は夕食を食べる前に、タオルを畳みました。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-18-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "接続詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n時間があれば、私はタオルを畳むつもりです。",
    "solutions": [
      "If I have time, I will fold a towel.",
      "I will fold a towel if I have time."
    ],
    "advice": "条件を表す if 節では、未来のことでも現在形を使います。\n和訳：時間があれば、私はタオルを畳むつもりです。",
    "grade": "中学2年",
    "unit": "接続詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-19-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "進行形・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n私は今、タオルを畳んでいます。",
    "solutions": [
      "I am folding a towel now.",
      "Now, I am folding a towel."
    ],
    "advice": "am＋動詞のing形で、今している動作を表します。\n和訳：私は今、タオルを畳んでいます。",
    "grade": "中学1年",
    "unit": "進行形",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-20-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "三単現・大文字・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n彼は毎週日曜日にタオルを畳みます。",
    "solutions": [
      "He folds a towel every Sunday.",
      "Every Sunday, he folds a towel."
    ],
    "advice": "主語が he の現在形なので、動詞は三人称単数の形です。Sunday は大文字で始めます。\n和訳：彼は毎週日曜日にタオルを畳みます。",
    "grade": "中学1年",
    "unit": "三単現・大文字",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  },
  {
    "id": "CL93-21-024",
    "revision": 1,
    "subject": "英語",
    "kind": "sentence",
    "title": "関係代名詞・タオル",
    "prompt": "日本語に合う英文を作りましょう。\n毎週日曜日にタオルを畳む女の子は私の友達です。",
    "solutions": [
      "The girl who folds a towel every Sunday is my friend.",
      "The girl that folds a towel every Sunday is my friend."
    ],
    "advice": "主格の who が the girl を説明します。who の後の動詞も三人称単数の現在形にします。\n和訳：毎週日曜日にタオルを畳む女の子は私の友達です。",
    "grade": "中学3年",
    "unit": "関係代名詞",
    "tags": [
      "英文整序",
      "文型反復",
      "追加v93"
    ],
    "caseSensitive": true,
    "punctuationSensitive": true,
    "lowerPool": true,
    "publication": "published"
  }
];
const ids=new Set(root.HISTORY_CARD_LAB_SEEDS.map(q=>q.id));root.HISTORY_CARD_LAB_SEEDS.push(...additions.filter(q=>!ids.has(q.id)));
})(window);
