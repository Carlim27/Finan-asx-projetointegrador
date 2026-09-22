const STORAGE_KEY = "financasx_transacoes";
const GOAL_KEY = "financasx_meta";
const BUDGET_KEY = "financasx_orcamentos";

// ===============================
// BARRA DE CARREGAMENTO GLOBAL
// ===============================

function mostrarLoading(mensagem = "Carregando...") {

let loading =
    document.getElementById("fsxLoading");

if (!loading) {

    loading = document.createElement("div");

    loading.id = "fsxLoading";

    loading.innerHTML = `
        <div class="fsx-loading-text">
            <span id="fsxLoadingMensagem">${mensagem}</span>
            <span id="fsxLoadingPercentual">0%</span>
        </div>

        <div class="fsx-loading-track">
            <div id="fsxLoadingBar"></div>
        </div>
    `;

    document.body.appendChild(loading);
}

loading.classList.add("ativo");

atualizarLoading(0, mensagem);

}

function atualizarLoading(
percentual,
mensagem
) {

const barra =
    document.getElementById("fsxLoadingBar");

const texto =
    document.getElementById(
        "fsxLoadingMensagem"
    );

const numero =
    document.getElementById(
        "fsxLoadingPercentual"
    );

if (barra) {
    barra.style.width =
        `${percentual}%`;
}

if (texto) {
    texto.textContent =
        mensagem;
}

if (numero) {
    numero.textContent =
        `${percentual}%`;
}

}

function esconderLoading() {

const loading =
    document.getElementById("fsxLoading");

if (!loading) {
    return;
}

atualizarLoading(
    100,
    "Concluído"
);

setTimeout(() => {

    loading.classList.remove(
        "ativo"
    );

}, 300);

}

const categorias = [
"Geral",
"Alimentação",
"Transporte",
"Lazer",
"Saúde",
"Educação",
"Moradia",
"Assinaturas",
"Investimentos",
"Contas",
"Compras"
];

const coresCategorias = [
"#38bdf8",
"#22c55e",
"#f59e0b",
"#8b5cf6",
"#ef4444",
"#14b8a6",
"#f97316",
"#e879f9",
"#84cc16",
"#06b6d4",
"#a78bfa"
];

let data =
JSON.parse(
localStorage.getItem(
STORAGE_KEY
)
) || [];

let meta =
JSON.parse(
localStorage.getItem(
GOAL_KEY
)
) || {

    titulo:
        "Meta principal",

    valor:
        5000
};

let budgets =
JSON.parse(
localStorage.getItem(
BUDGET_KEY
)
) || {};

let overviewChart = null;
let categoryChart = null;
let monthlyChart = null;

const ITEMS_PER_PAGE = 10;

let currentPage = 1;

/* =====================================================
FUNÇÕES AUXILIARES
===================================================== */

const $ =
id =>
document.getElementById(id);

const has =
id =>
!!$(id);

function escaparHtml(valor) {
    return String(valor ??"")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* =====================================================
NOTIFICAÇÕES
===================================================== */

function mostrarNotificacao(
mensagem,
tipo = "sucesso"
) {

const notificacao =
    document.createElement("div");

notificacao.className =
    `fsx-notificacao ${tipo}`;

notificacao.textContent =
    mensagem;

document.body.appendChild(
    notificacao
);

setTimeout(() => {

    notificacao.classList.add(
        "saindo"
    );

    setTimeout(() => {

        notificacao.remove();

    }, 300);

}, 3000);

}

/* =====================================================
CONFIRMAÇÃO FSX
===================================================== */

function mostrarConfirmacao(
mensagem,
aoConfirmar
) {

const overlay =
    document.createElement("div");

overlay.className =
    "fsx-confirmacao-overlay";

overlay.innerHTML = `
    <div class="fsx-confirmacao">

        <h3>
            Confirmar ação
        </h3>

        <p>
            ${mensagem}
        </p>

        <div class="fsx-confirmacao-acoes">

            <button
                class="fsx-confirmar-cancelar">
                Cancelar
            </button>

            <button
                class="fsx-confirmar-ok">
                Confirmar
            </button>

        </div>

    </div>
`;

document.body.appendChild(
    overlay
);

const cancelar =
    overlay.querySelector(
        ".fsx-confirmar-cancelar"
    );

const confirmar =
    overlay.querySelector(
        ".fsx-confirmar-ok"
    );

cancelar.addEventListener(
    "click",
    () => {

        overlay.remove();

    }
);

confirmar.addEventListener(
    "click",
    () => {

        overlay.remove();

        aoConfirmar();

    }
);

}

function format(valor) {

return Number(
    valor || 0
).toLocaleString(
    "pt-BR",
    {
        style:
            "currency",

        currency:
            "BRL"
    }
);

}

function salvarDados() {

localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
);

}

function salvarMeta() {

localStorage.setItem(
    GOAL_KEY,
    JSON.stringify(meta)
);

}

function salvarBudgets() {

localStorage.setItem(
    BUDGET_KEY,
    JSON.stringify(budgets)
);

}

function formatarData(valor) {

if (!valor) {

    return new Date()
        .toLocaleDateString(
            "pt-BR"
        );
}

return new Date(
    `${valor}T12:00:00`
).toLocaleDateString(
    "pt-BR"
);

}

function extrairMes(valor) {

if (!valor) {
    return "Sem data";
}

const [ano, mes] =
    valor.split("-");

return `${mes}/${ano}`;

}

function getMonthNameKey(valor) {

return new Date(
    `${valor}T12:00:00`
).toLocaleDateString(
    "pt-BR",
    {
        month:
            "short",

        year:
            "numeric"
    }
);

}

/* =====================================================
NORMALIZAÇÃO
===================================================== */

function normalizarDados() {

data =
    data.map(item => {

        const dataISO =
            item.dataISO ||
            new Date()
                .toISOString()
                .split("T")[0];

        return {

            ...item,

            valor:
                Number(
                    item.valor
                ) || 0,

            pagamento:
                item.pagamento ||
                "Pix",

            observacao:
                item.observacao ||
                "",

            dataISO,

            dataFormatada:
                item.dataFormatada ||
                formatarData(
                    dataISO
                )
        };
    });

salvarDados();

}

/* =====================================================
CATEGORIAS
===================================================== */

function preencherCategorias() {

if (has("cat")) {

    $("cat").innerHTML =
        categorias
            .map(
                categoria =>
                    `<option value="${categoria}">
                        ${categoria}
                    </option>`
            )
            .join("");
}

if (has("budgetCategoria")) {

    $("budgetCategoria").innerHTML =
        categorias
            .map(
                categoria =>
                    `<option value="${categoria}">
                        ${categoria}
                    </option>`
            )
            .join("");
}

if (has("filterCategoria")) {

    $("filterCategoria").innerHTML =
        `
        <option value="todas">
            Todas as categorias
        </option>
        ` +
        categorias
            .map(
                categoria =>
                    `<option value="${categoria}">
                        ${categoria}
                    </option>`
            )
            .join("");
}

}

/* =====================================================
MESES DO FILTRO
===================================================== */

function preencherMesesFiltro() {

if (!has("filterMes")) {
    return;
}

const selecionado =
    $("filterMes").value ||
    "todos";

const meses =
    [
        ...new Set(
            data.map(
                item =>
                    extrairMes(
                        item.dataISO
                    )
            )
        )
    ].filter(Boolean);

$("filterMes").innerHTML =
    `
    <option value="todos">
        Todos os meses
    </option>
    ` +
    meses
        .map(
            mes =>
                `<option value="${mes}">
                    ${mes}
                </option>`
        )
        .join("");

$("filterMes").value =
    meses.includes(
        selecionado
    ) ||
    selecionado === "todos"
        ? selecionado
        : "todos";

}

/* =====================================================
DATA PADRÃO
===================================================== */

function setDefaultDate() {

if (
    has("dataLancamento") &&
    !$("dataLancamento").value
) {

    $("dataLancamento").value =
        new Date()
            .toISOString()
            .split("T")[0];
}

}

/* =====================================================
FILTROS
===================================================== */

function obterFiltradas() {

if (!has("searchInput")) {
    return [...data];
}

const termo =
    $("searchInput")
        .value
        .trim()
        .toLowerCase();

const tipo =
    $("filterTipo").value;

const categoria =
    $("filterCategoria").value;

const mes =
    $("filterMes").value;

return [...data]

    .filter(
        item =>
            tipo === "todos" ||
            item.tipo === tipo
    )

    .filter(
        item =>
            categoria === "todas" ||
            item.categoria ===
                categoria
    )

    .filter(
        item =>
            mes === "todos" ||
            extrairMes(
                item.dataISO
            ) === mes
    )

    .filter(item => {

        if (!termo) {
            return true;
        }

        return [
            item.descricao,
            item.categoria,
            item.pagamento,
            item.observacao
        ]
            .join(" ")
            .toLowerCase()
            .includes(termo);
    })

    .sort(
        (a, b) =>
            new Date(
                b.dataISO
            ) -
            new Date(
                a.dataISO
            )
    );

}

/* =====================================================
META
===================================================== */

function atualizarMeta(
saldo = null
) {

const valorMeta =
    Number(
        meta.valor || 0
    );

if (saldo === null) {

    const entradas =
        data
            .filter(
                item =>
                    item.tipo ===
                    "entrada"
            )
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.valor ||
                        0
                    ),
                0
            );

    const saidas =
        data
            .filter(
                item =>
                    item.tipo ===
                    "saida"
            )
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.valor ||
                        0
                    ),
                0
            );

    saldo =
        entradas -
        saidas;
}

const progresso =
    valorMeta > 0
        ? Math.max(
            0,
            Math.min(
                Number(saldo),
                valorMeta
            )
        )
        : 0;

const percentual =
    valorMeta > 0
        ? (
            progresso /
            valorMeta
        ) * 100
        : 0;

const nome =
    meta.titulo ||
    "Meta principal";

const valorTexto =
    `${format(progresso)} / ${format(valorMeta)}`;

const percentTexto =
    `${percentual.toFixed(1)}%`;

const faltante =
    Math.max(
        valorMeta -
        progresso,
        0
    );

const hint =
    percentual >= 100
        ? "Meta atingida. Hora de definir o próximo objetivo."
        : `Faltam ${format(faltante)} para atingir sua meta.`;

if (has("metaInput")) {

    $("metaInput").value =
        valorMeta || "";
}

if (has("metaTitulo")) {

    $("metaTitulo").value =
        meta.titulo || "";
}

if (has("metaNomeExibida2")) {

    $("metaNomeExibida2")
        .textContent =
        nome;
}

if (has("metaValor2")) {

    $("metaValor2")
        .textContent =
        valorTexto;
}

if (has("metaPercent2")) {

    $("metaPercent2")
        .textContent =
        percentTexto;
}

if (has("metaBar2")) {

    $("metaBar2").value =
        percentual;
}

if (has("metaHint2")) {

    $("metaHint2")
        .textContent =
        hint;
}

if (has("metaNomeExibida")) {

    $("metaNomeExibida")
        .textContent =
        nome;
}

if (has("metaValor")) {

    $("metaValor")
        .textContent =
        valorTexto;
}

if (has("metaPercent")) {

    $("metaPercent")
        .textContent =
        percentTexto;
}

if (has("metaBar")) {

    $("metaBar").value =
        percentual;
}

if (has("metaHint")) {

    $("metaHint")
        .textContent =
        hint;
}

if (has("dashboardMetaTitulo")) {

    $("dashboardMetaTitulo")
        .textContent =
        nome;
}

}

/* =====================================================
RESUMO
===================================================== */

function atualizarResumo() {

if (!has("saldo")) {

    atualizarMeta();

    return;
}

const entradas =
    data
        .filter(
            item =>
                item.tipo ===
                "entrada"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const saidas =
    data
        .filter(
            item =>
                item.tipo ===
                "saida"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const saldo =
    entradas -
    saidas;

$("saldo").textContent =
    format(saldo);

$("entradas").textContent =
    format(entradas);

$("saidas").textContent =
    format(saidas);

$("taxaPoupanca")
    .textContent =
    `${
        entradas > 0
            ? Math.max(
                0,
                (
                    saldo /
                    entradas
                ) * 100
            ).toFixed(1)
            : 0
    }%`;

$("saldoStatus")
    .textContent =
    saldo > 0
        ? "Seu saldo está positivo."
        : saldo < 0
            ? "Seu saldo exige atenção."
            : "Sem sobra financeira no momento.";

const mesAtual =
    new Date()
        .toISOString()
        .slice(0, 7);

const atual =
    data.filter(
        item =>
            item.dataISO?.startsWith(
                mesAtual
            )
    );

const entradasMes =
    atual
        .filter(
            item =>
                item.tipo ===
                "entrada"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const saidasMes =
    atual
        .filter(
            item =>
                item.tipo ===
                "saida"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const economia =
    entradasMes -
    saidasMes;

$("economiaMes")
    .textContent =
    format(economia);

$("economiaStatus")
    .textContent =
    economia >= 0
        ? "Você está acumulando no mês atual."
        : "O mês atual está no vermelho.";

const maior =
    [...data]
        .filter(
            item =>
                item.tipo ===
                "saida"
        )
        .sort(
            (a, b) =>
                Number(
                    b.valor
                ) -
                Number(
                    a.valor
                )
        )[0];

$("maiorGasto")
    .textContent =
    maior
        ? format(
            maior.valor
        )
        : format(0);

$("maiorGastoDesc")
    .textContent =
    maior
        ? `${maior.descricao} • ${maior.categoria}`
        : "Sem despesas registradas.";

atualizarAlerta(
    saldo
);

atualizarMeta(
    saldo
);

}

/* =====================================================
ALERTA
===================================================== */

function atualizarAlerta(
saldo
) {

if (!has("alert")) {
    return;
}

$("alert").className =
    "";

$("alert").innerHTML =
    "";

if (saldo < 0) {

    $("alert").classList.add(
        "alert",
        "redA"
    );

    $("alert").textContent =
        "⚠️ Seu saldo está negativo. Reveja seus gastos e prioridades.";

} else if (
    saldo <
    Number(
        meta.valor || 0
    ) * 0.2
) {

    $("alert").classList.add(
        "alert",
        "yellowA"
    );

    $("alert").textContent =
        "⚠️ Seu saldo ainda está distante da meta.";

} else {

    $("alert").classList.add(
        "alert",
        "greenA"
    );

    $("alert").textContent =
        "✅ Sua organização financeira está atualizada.";
}

}

/* =====================================================
ORÇAMENTO
===================================================== */

function atualizarBudgets() {

if (!has("budgetList")) {
    return;
}

const gastos = {};

data
    .filter(
        item =>
            item.tipo ===
            "saida"
    )
    .forEach(item => {

        gastos[
            item.categoria
        ] =
            (
                gastos[
                    item.categoria
                ] || 0
            ) +
            Number(
                item.valor
            );
    });

const categoriasOrcadas =
    Object.keys(
        budgets
    );

if (
    !categoriasOrcadas.length
) {

    $("budgetList").innerHTML =
        `
        <div class="empty-state">
            Defina limites mensais por categoria para acompanhar seu orçamento.
        </div>
        `;

    return;
}

$("budgetList").innerHTML =
    categoriasOrcadas
        .map(
            categoria => {

                const limite =
                    Number(
                        budgets[
                            categoria
                        ]
                    );

                const gasto =
                    gastos[
                        categoria
                    ] || 0;

                const percentual =
                    limite > 0
                        ? Math.min(
                            (
                                gasto /
                                limite
                            ) * 100,
                            100
                        )
                        : 0;

                const excedeu =
                    gasto >
                    limite;

                return `
                    <div class="budget-item">

                        <div class="budget-head">

                            <strong>
                                ${categoria}
                            </strong>

                            <span>
                                ${percentual.toFixed(1)}%
                            </span>

                        </div>

                        <progress
                            value="${percentual}"
                            max="100">
                        </progress>

                        <div class="budget-meta">

                            <span>
                                Gasto:
                                ${format(gasto)}
                            </span>

                            <span>
                                ${
                                    excedeu
                                        ? `Acima em ${format(
                                            gasto -
                                            limite
                                        )}`
                                        : `Restante: ${format(
                                            limite -
                                            gasto
                                        )}`
                                }
                            </span>

                        </div>

                    </div>
                `;
            }
        )
        .join("");

}

/* =====================================================
TRANSAÇÃO HTML
===================================================== */

function transacaoHtml(
item
) {
    const descricao=
    escaparHtml(item.descricao);

    const categoria =
    escaparHtml(item.categoria);

    const pagamento =
    escaparHtml(item.pagamento||"Sem forma de pagamento");

    const observacao =
    escaparHtml(item.observacao||"");

return `
    <div class="item">

        <div class="item-info">

            <div class="item-title-row">

                <strong>
                    ${descricao}
                </strong>

                <span
                    class="badge ${item.tipo}">
                    ${
                        item.tipo ===
                        "entrada"
                            ? "Entrada"
                            : "Saída"
                    }
                </span>

            </div>

            <div class="small">

                ${categoria}

                •

                ${
                    item.dataFormatada ||
                    formatarData(
                        item.dataISO
                    )
                }

                •

                ${pagamento}

                ${observacao
                        ? `<br>${item.observacao}`
                        : ""}

            </div>

        </div>

        <div class="item-value">

            <span class="${
                item.tipo ===
                "entrada"
                    ? "green"
                    : "red"
            }">

                ${
                    item.tipo ===
                    "entrada"
                        ? "+"
                        : "-"
                }

                ${format(
                    item.valor
                )}

            </span>

<button
    class="icon-btn edit-btn"
    onclick="editarItem(${item.id})"
    title="Editar lançamento"
    aria-label="Editar lançamento">
    ✏️
</button>

<button
    class="icon-btn delete-btn"
    onclick="removerItem(${item.id})"
    title="Excluir lançamento"
    aria-label="Excluir lançamento">
    🗑️
</button>

        </div>

    </div>
`;

}

/* =====================================================
DASHBOARD
===================================================== */

function renderDashboard() {

if (
    !has(
        "dashboardTransactions"
    )
) {
    return;
}

const recentes =
    [...data]
        .sort(
            (a, b) =>
                new Date(
                    b.dataISO
                ) -
                new Date(
                    a.dataISO
                )
        )
        .slice(0, 4);

$("dashboardTransactions")
    .innerHTML =
    recentes.length
        ? recentes
            .map(
                transacaoHtml
            )
            .join("")
        : `
            <div class="empty-state">
                Ainda não há lançamentos registrados.
            </div>
        `;

}

/* =====================================================
LANÇAMENTOS
===================================================== */

function renderLancamentos() {

if (!has("list")) {
    return;
}

const filtradas =
    obterFiltradas();

const totalPages =
    Math.max(
        1,
        Math.ceil(
            filtradas.length /
            ITEMS_PER_PAGE
        )
    );

currentPage =
    Math.min(
        currentPage,
        totalPages
    );

const inicio =
    (
        currentPage -
        1
    ) *
    ITEMS_PER_PAGE;

const pagina =
    filtradas.slice(
        inicio,
        inicio +
        ITEMS_PER_PAGE
    );

$("transactionCounter")
    .textContent =
    `${filtradas.length} ${
        filtradas.length === 1
            ? "item"
            : "itens"
    }`;

$("list").innerHTML =
    pagina.length
        ? pagina
            .map(
                transacaoHtml
            )
            .join("")
        : `
            <div class="empty-state">
                Nenhum lançamento encontrado com os filtros atuais.
            </div>
        `;

if (has("pageInfo")) {

    $("pageInfo").textContent =
        `Página ${currentPage} de ${totalPages}`;
}

if (has("prevPageBtn")) {

    $("prevPageBtn").disabled =
        currentPage <= 1;
}

if (has("nextPageBtn")) {

    $("nextPageBtn").disabled =
        currentPage >=
        totalPages;
}

if (has("pagination")) {

    $("pagination")
        .classList.toggle(
            "hidden",
            totalPages <= 1
        );
}

}

/* =====================================================
SALVAR META
===================================================== */

function salvarMetaHandler() {

const valor =
    parseFloat(
        $("metaInput").value
    );

const titulo =
    $("metaTitulo")
        .value
        .trim() ||
    "Meta principal";

if (
    !valor ||
    valor <= 0
) {

    mostrarNotificacao(
        "Digite um valor de meta válido.",
        "erro"
    );

    return;
}

meta = {
    titulo,
    valor
};

salvarMeta();

atualizarResumo();

atualizarMeta();

mostrarNotificacao(
    "meta salva com sucesso.",
    "sucesso"
);

}

/* =====================================================
SALVAR ORÇAMENTO
===================================================== */

function salvarBudgetHandler() {

const categoria =
    $("budgetCategoria")
        .value;

const valor =
    parseFloat(
        $("budgetValor")
            .value
    );

if (!categoria) {

    mostrarNotificacao(
        "Selecione uma categoria.",
        "erro"
    );

    return;
}

if (
    !valor ||
    valor <= 0
) {

    mostrarNotificacao(
        "Digite um valor de limite válido.",
        "erro"
    );

    return;
}

budgets[categoria] =
    valor;

salvarBudgets();

$("budgetValor").value =
    "";

atualizarBudgets();

mostrarNotificacao(
    "Orçamento salvo com sucesso.",
    "sucesso"
);

}

/* =====================================================
ADICIONAR / EDITAR LANÇAMENTO
===================================================== */

function handleSubmit(e) {

e.preventDefault();

const descricao =
    $("desc")
        .value
        .trim();

const valor =
    parseFloat(
        $("valor").value
    );

if (!descricao) {

    mostrarNotificacao(
        "Digite uma descrição.",
        "erro"
    );

    return;
}

if (
    !valor ||
    valor <= 0
) {

    mostrarNotificacao(
        "Digite um valor válido.",
        "erro"
    );

    return;
}

const dataISO =
    $("dataLancamento")
        .value;

if (!dataISO) {

    mostrarNotificacao(
        "Selecione a data do lançamento.",
        "erro"
    );

    return;
}

const editId =
    $("editId").value;

const payload = {

    id:
        editId
            ? Number(editId)
            : Date.now(),

    descricao,

    valor,

    tipo:
        $("tipo").value,

    categoria:
        $("cat").value,

    pagamento:
        $("pagamento").value,

    observacao:
        $("obs")
            .value
            .trim(),

    dataISO,

    dataFormatada:
        formatarData(
            dataISO
        )
};

if (editId) {

    data =
        data.map(
            item =>
                item.id ===
                Number(editId)
                    ? payload
                    : item
        );

} else {

    data.unshift(
        payload
    );
}

salvarDados();

$("transactionForm")
    .reset();

$("editId").value =
    "";

$("submitBtn").textContent =
    "Adicionar lançamento";

$("cancelEditBtn")
    .classList.add(
        "hidden"
    );

setDefaultDate();

currentPage = 1;

atualizarResumo();

atualizarMeta();

renderLancamentos();

renderDashboard();

atualizarBudgets();

atualizarGraficos();

mostrarNotificacao(
    editId
        ? "Lançamento atualizado com sucesso."
        : "Lançamento adicionado com sucesso.",
    "sucesso"
);

}

/* =====================================================
EDITAR ITEM
===================================================== */

function editarItem(id) {

if (!has("transactionForm")) {

    window.location.href =
        "lancamentos.html";

    return;
}

const item =
    data.find(
        x =>
            x.id === id
    );

if (!item) {
    return;
}

$("editId").value =
    item.id;

$("desc").value =
    item.descricao;

$("valor").value =
    item.valor;

$("tipo").value =
    item.tipo;

$("cat").value =
    item.categoria;

$("pagamento").value =
    item.pagamento ||
    "Pix";

$("dataLancamento").value =
    item.dataISO;

$("obs").value =
    item.observacao ||
    "";

$("submitBtn").textContent =
    "Salvar alterações";

$("cancelEditBtn")
    .classList.remove(
        "hidden"
    );

window.scrollTo({
    top: 0,
    behavior:
        "smooth"
});

}

/* =====================================================
REMOVER ITEM
===================================================== */

function removerItem(id) {

    mostrarConfirmacao(
        "Deseja remover este lançamento? Essa ação não poderá ser desfeita.",
        () => {

            data =
                data.filter(
                    item =>
                        item.id !== id
                );

            salvarDados();

            atualizarResumo();

            atualizarMeta();

            renderLancamentos();

            renderDashboard();

            atualizarBudgets();

            atualizarGraficos();

            mostrarNotificacao(
                "Lançamento removido com sucesso.",
                "sucesso"
            );
        }
    );
}

/* =====================================================
FILTROS
===================================================== */

function limparFiltros() {

$("searchInput").value =
    "";

$("filterTipo").value =
    "todos";

$("filterCategoria").value =
    "todas";

$("filterMes").value =
    "todos";

currentPage = 1;

renderLancamentos();

}

/* =====================================================
GRÁFICOS
===================================================== */

function criarGrafico(
id,
config
) {

const canvas =
    $(id);

if (
    !canvas ||
    typeof Chart ===
        "undefined"
) {
    return null;
}

return new Chart(
    canvas,
    config
);

}

function atualizarGraficos() {

if (!has("overviewChart")) {
    return;
}

const entradas =
    data
        .filter(
            i =>
                i.tipo ===
                "entrada"
        )
        .reduce(
            (
                a,
                i
            ) =>
                a +
                Number(
                    i.valor
                ),
            0
        );

const saidas =
    data
        .filter(
            i =>
                i.tipo ===
                "saida"
        )
        .reduce(
            (
                a,
                i
            ) =>
                a +
                Number(
                    i.valor
                ),
            0
        );

if (overviewChart) {

    overviewChart.destroy();
}

overviewChart =
    criarGrafico(
        "overviewChart",
        {

            type:
                "doughnut",

            data: {

                labels: [
                    "Entradas",
                    "Saídas"
                ],

                datasets: [
                    {

                        data: [
                            entradas,
                            saidas
                        ],

                        backgroundColor:
                            [
                                "#22c55e",
                                "#ef4444"
                            ],

                        borderWidth:
                            0
                    }
                ]
            },

            options: {

                responsive:
                    true,

                maintainAspectRatio:
                    false
            }
        }
    );


const cats = {};

data
    .filter(
        i =>
            i.tipo ===
            "saida"
    )
    .forEach(
        i => {

            cats[
                i.categoria
            ] =
                (
                    cats[
                        i.categoria
                    ] || 0
                ) +
                Number(
                    i.valor
                );
        }
    );


if (categoryChart) {

    categoryChart.destroy();
}

categoryChart =
    criarGrafico(
        "categoryChart",
        {

            type:
                "bar",

            data: {

                labels:
                    Object.keys(
                        cats
                    ),

                datasets: [
                    {

                        label:
                            "Gastos",

                        data:
                            Object.values(
                                cats
                            ),

                        backgroundColor:
                            Object.keys(
                                cats
                            ).map(
                                (
                                    _,
                                    i
                                ) =>
                                    coresCategorias[
                                        i %
                                        coresCategorias.length
                                    ]
                            ),

                        borderRadius:
                            10
                    }
                ]
            },

            options: {

                responsive:
                    true,

                maintainAspectRatio:
                    false
            }
        }
    );


const mensal = {};

data.forEach(
    i => {

        const chave =
            i.dataISO?.slice(
                0,
                7
            ) ||
            "Sem data";

        if (!mensal[chave]) {

            mensal[chave] = {

                entradas:
                    0,

                saidas:
                    0
            };
        }

        mensal[chave][
            i.tipo ===
            "entrada"
                ? "entradas"
                : "saidas"
        ] +=
            Number(
                i.valor
            );
    }
);


const keys =
    Object.keys(
        mensal
    ).sort();


const labels =
    keys.map(
        k =>
            k === "Sem data"
                ? k
                : getMonthNameKey(
                    `${k}-01`
                )
    );


const saldos =
    keys.map(
        k =>
            mensal[k]
                .entradas -
            mensal[k]
                .saidas
    );


if (monthlyChart) {

    monthlyChart.destroy();
}


monthlyChart =
    criarGrafico(
        "monthlyChart",
        {

            type:
                "line",

            data: {

                labels,

                datasets: [
                    {

                        label:
                            "Saldo mensal",

                        data:
                            saldos,

                        borderColor:
                            "#38bdf8",

                        backgroundColor:
                            "rgba(56,189,248,.18)",

                        fill:
                            true,

                        tension:
                            .35
                    }
                ]
            },

            options: {

                responsive:
                    true,

                maintainAspectRatio:
                    false
            }
        }
    );

}

/* =====================================================
FUNDO ANIMADO
===================================================== */

function animateBackground() {

const canvas =
    $("bg");

if (!canvas) {
    return;
}

const ctx =
    canvas.getContext(
        "2d"
    );

let w =
    canvas.width =
        innerWidth;

let h =
    canvas.height =
        innerHeight;

const points =
    Array.from(
        {
            length:
                Math.min(
                    65,
                    Math.floor(
                        w / 20
                    )
                )
        },
        () => ({

            x:
                Math.random() *
                w,

            y:
                Math.random() *
                h,

            r:
                Math.random() *
                2.2 +
                1,

            sx:
                (
                    Math.random() -
                    0.5
                ) *
                0.5,

            sy:
                (
                    Math.random() -
                    0.5
                ) *
                0.5
        })
    );


function resize() {

    w =
        canvas.width =
            innerWidth;

    h =
        canvas.height =
            innerHeight;
}


function draw() {

    ctx.clearRect(
        0,
        0,
        w,
        h
    );

    points.forEach(
        p => {

            p.x +=
                p.sx;

            p.y +=
                p.sy;

            if (
                p.x < 0 ||
                p.x > w
            ) {

                p.sx *=
                    -1;
            }

            if (
                p.y < 0 ||
                p.y > h
            ) {

                p.sy *=
                    -1;
            }

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.r,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(56,189,248,.35)";

            ctx.fill();
        }
    );

    requestAnimationFrame(
        draw
    );
}


addEventListener(
    "resize",
    resize
);

draw();

}

/* =====================================================
PÁGINA ATUAL
===================================================== */

function marcarPaginaAtual() {

const atual =
    location.pathname
        .split("/")
        .pop() ||
    "index.html";

document
    .querySelectorAll(
        ".nav-btn"
    )
    .forEach(
        link => {

            link.classList.toggle(
                "active",
                link.dataset.page ===
                    atual
            );
        }
    );

}

/* =====================================================
EVENTOS
===================================================== */

function bindEvents() {

if (
    has(
        "transactionForm"
    )
) {

    $("transactionForm")
        .addEventListener(
            "submit",
            handleSubmit
        );
}


if (
    has(
        "cancelEditBtn"
    )
) {

    $("cancelEditBtn")
        .addEventListener(
            "click",
            () => {

                $("transactionForm")
                    .reset();

                $("editId").value =
                    "";

                $("submitBtn")
                    .textContent =
                    "Adicionar lançamento";

                $("cancelEditBtn")
                    .classList.add(
                        "hidden"
                    );

                setDefaultDate();
            }
        );
}


if (
    has(
        "saveGoalBtn"
    )
) {

    $("saveGoalBtn")
        .addEventListener(
            "click",
            salvarMetaHandler
        );
}


if (
    has(
        "saveBudgetBtn"
    )
) {

    $("saveBudgetBtn")
        .addEventListener(
            "click",
            salvarBudgetHandler
        );
}


if (
    has(
        "clearFiltersBtn"
    )
) {

    $("clearFiltersBtn")
        .addEventListener(
            "click",
            limparFiltros
        );
}


if (
    has(
        "prevPageBtn"
    )
) {

    $("prevPageBtn")
        .addEventListener(
            "click",
            () => {

                if (
                    currentPage >
                    1
                ) {

                    currentPage--;

                    renderLancamentos();
                }
            }
        );
}


if (
    has(
        "nextPageBtn"
    )
) {

    $("nextPageBtn")
        .addEventListener(
            "click",
            () => {

                const total =
                    Math.max(
                        1,
                        Math.ceil(
                            obterFiltradas()
                                .length /
                            ITEMS_PER_PAGE
                        )
                    );

                if (
                    currentPage <
                    total
                ) {

                    currentPage++;

                    renderLancamentos();
                }
            }
        );
}


if (
    has(
        "searchInput"
    )
) {

    $("searchInput")
        .addEventListener(
            "input",
            () => {

                currentPage = 1;

                renderLancamentos();
            }
        );
}


[
    "filterTipo",
    "filterCategoria",
    "filterMes"
].forEach(
    id => {

        if (has(id)) {

            $(id).addEventListener(
                "change",
                () => {

                    currentPage = 1;

                    renderLancamentos();
                }
            );
        }
    }
);


$("anoFiscal")?.addEventListener(
    "change",
    atualizarFiscal
);


document
    .querySelectorAll(
        ".nav-btn"
    )
    .forEach(
        link => {

            const destino =
                link.getAttribute(
                    "href"
                );

            if (!destino) {
                return;
            }

            link.addEventListener(
                "click",
                e => {

                    e.preventDefault();

                    document.body.classList.add(
                        "fsx-saindo"
                    );

                    setTimeout(
                        () => {

                            window.location.href =
                                destino;

                        },
                        180
                    );
                }
            );
        }
    );

}

/* =====================================================
FISCAL
===================================================== */

function atualizarFiscal() {

if (!has("fiscalReceitas")) {
    return;
}

const seletorAno =
    $("anoFiscal");

const ano =
    seletorAno
        ? seletorAno.value
        : "2026";

const lancamentosAno =
    data.filter(
        item => {

            if (!item.dataISO) {
                return false;
            }

            return item.dataISO
                .startsWith(
                    `${ano}-`
                );
        }
    );


const receitas =
    lancamentosAno
        .filter(
            item =>
                item.tipo ===
                "entrada"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor ||
                    0
                ),
            0
        );


const despesas =
    lancamentosAno
        .filter(
            item =>
                item.tipo ===
                "saida"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor ||
                    0
                ),
            0
        );


const investimentos =
    lancamentosAno
        .filter(
            item =>
                item.tipo ===
                    "saida" &&
                item.categoria ===
                    "Investimentos"
        )
        .reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.valor ||
                    0
                ),
            0
        );


$("fiscalReceitas")
    .textContent =
    format(
        receitas
    );

$("fiscalDespesas")
    .textContent =
    format(
        despesas
    );

$("fiscalInvestimentos")
    .textContent =
    format(
        investimentos
    );

$("fiscalMovimentacoes")
    .textContent =
    lancamentosAno.length;


if (
    has(
        "fiscalResumoReceitas"
    )
) {

    $("fiscalResumoReceitas")
        .textContent =
        format(
            receitas
        );
}


if (
    has(
        "fiscalResumoDespesas"
    )
) {

    $("fiscalResumoDespesas")
        .textContent =
        format(
            despesas
        );
}


if (
    has(
        "fiscalResumoInvestimentos"
    )
) {

    $("fiscalResumoInvestimentos")
        .textContent =
        format(
            investimentos
        );
}


if (
    has(
        "fiscalResumoMovimentacoes"
    )
) {

    $("fiscalResumoMovimentacoes")
        .textContent =
        lancamentosAno.length;
}

}

/* =====================================================
INICIALIZAÇÃO
===================================================== */

function esperarRender() {

return new Promise(
    resolve => {

        requestAnimationFrame(
            () => {

                resolve();

            }
        );
    }
);

}

async function init() {

mostrarLoading(
    "Carregando dados..."
);

atualizarLoading(
    10,
    "Lendo dados..."
);

await esperarRender();


normalizarDados();

atualizarLoading(
    25,
    "Preparando categorias..."
);

await esperarRender();


preencherCategorias();

atualizarLoading(
    35,
    "Preparando filtros..."
);

await esperarRender();


preencherMesesFiltro();

atualizarLoading(
    45,
    "Configurando data..."
);

await esperarRender();


setDefaultDate();

atualizarLoading(
    55,
    "Configurando eventos..."
);

await esperarRender();


bindEvents();

atualizarLoading(
    65,
    "Atualizando página..."
);

await esperarRender();


marcarPaginaAtual();

atualizarLoading(
    75,
    "Calculando resumo financeiro..."
);

await esperarRender();


atualizarResumo();

atualizarLoading(
    80,
    "Atualizando metas..."
);

await esperarRender();


atualizarMeta();

atualizarLoading(
    85,
    "Atualizando orçamento..."
);

await esperarRender();


atualizarBudgets();

atualizarLoading(
    90,
    "Preparando lançamentos..."
);

await esperarRender();


renderLancamentos();

renderDashboard();

atualizarLoading(
    95,
    "Preparando gráficos..."
);

await esperarRender();


atualizarGraficos();

atualizarFiscal();

animateBackground();


atualizarLoading(
    100,
    "FinançaSX pronto!"
);

await esperarRender();


mostrarNotificacao(
    "FinançaSX pronto!",
    "sucesso"
);

esconderLoading();

}

/* =====================================================
FUNÇÕES GLOBAIS
===================================================== */

window.editarItem =
editarItem;

window.removerItem =
removerItem;

/* =====================================================
INICIAR SISTEMA
===================================================== */

init();