const STORAGE_KEY = "financasx_transacoes";
const GOAL_KEY = "financasx_meta";
const BUDGET_KEY = "financasx_orcamentos";

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
localStorage.getItem(STORAGE_KEY)
) || [];

let meta =
JSON.parse(
localStorage.getItem(GOAL_KEY)
) || {
titulo: "Meta principal",
valor: 5000
};

let budgets =
JSON.parse(
localStorage.getItem(BUDGET_KEY)
) || {};

let overviewChart = null;
let categoryChart = null;
let monthlyChart = null;

const ITEMS_PER_PAGE = 10;
let currentPage = 1;

const $ = id =>
document.getElementById(id);

const has = id =>
!!$(id);

function format(valor) {
return Number(valor || 0).toLocaleString(
"pt-BR",
{
style: "currency",
currency: "BRL"
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
return new Date().toLocaleDateString(
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
if (!valor) return "Sem data";

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
        month: "short",
        year: "numeric"
    }
);
}

function normalizarDados() {
data = data.map(item => {
const dataISO =
item.dataISO ||
new Date()
.toISOString()
.split("T")[0];

    return {
        ...item,
        valor:
            Number(item.valor) || 0,
        pagamento:
            item.pagamento || "Pix",
        observacao:
            item.observacao || "",
        dataISO,
        dataFormatada:
            item.dataFormatada ||
            formatarData(dataISO)
    };
});

salvarDados();

}

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
            data.map(item =>
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
    meses.includes(selecionado) ||
    selecionado === "todos"
        ? selecionado
        : "todos";

}

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
            item.categoria === categoria
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

function atualizarResumo() {

if (!has("saldo")) {
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
            (total, item) =>
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
            (total, item) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const saldo =
    entradas - saidas;

$("saldo").textContent =
    format(saldo);

$("entradas").textContent =
    format(entradas);

$("saidas").textContent =
    format(saidas);

$("taxaPoupanca").textContent =
    `${
        entradas > 0
            ? Math.max(
                0,
                (saldo /
                    entradas) *
                    100
            ).toFixed(1)
            : 0
    }%`;

$("saldoStatus").textContent =
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
    data.filter(item =>
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
            (total, item) =>
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
            (total, item) =>
                total +
                Number(
                    item.valor
                ),
            0
        );

const economia =
    entradasMes -
    saidasMes;

$("economiaMes").textContent =
    format(economia);

$("economiaStatus").textContent =
    economia >= 0
        ? "Você está acumulando no mês atual."
        : "O mês atual está no vermelho.";

const maior =
    data
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

$("maiorGasto").textContent =
    maior
        ? format(maior.valor)
        : format(0);

$("maiorGastoDesc").textContent =
    maior
        ? `${maior.descricao} • ${maior.categoria}`
        : "Sem despesas registradas.";

atualizarAlerta(saldo);
function atualizarMeta(saldo = null) {

    const valorMeta = Number(meta.valor || 0);

    // Se não recebeu saldo, calcula diretamente pelos lançamentos
    if (saldo === null) {
        const entradas = data
            .filter(item => item.tipo === "entrada")
            .reduce((total, item) => {
                return total + Number(item.valor || 0);
            }, 0);

        const saidas = data
            .filter(item => item.tipo === "saida")
            .reduce((total, item) => {
                return total + Number(item.valor || 0);
            }, 0);

        saldo = entradas - saidas;
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
            ? (progresso / valorMeta) * 100
            : 0;

    const nome =
        meta.titulo || "Meta principal";

    const valorTexto =
        `${format(progresso)} / ${format(valorMeta)}`;

    const percentTexto =
        `${percentual.toFixed(1)}%`;

    const hint =
        percentual >= 100
            ? "Meta atingida. Hora de definir o próximo objetivo."
            : `Faltam ${format(
                Math.max(
                    valorMeta - progresso,
                    0
                )
            )} para atingir sua meta.`;

    /* =========================
       PÁGINA DE METAS
    ========================= */

    if (has("metaInput")) {
        $("metaInput").value =
            valorMeta || "";
    }

    if (has("metaTitulo")) {
        $("metaTitulo").value =
            meta.titulo || "";
    }

    if (has("metaNomeExibida2")) {
        $("metaNomeExibida2").textContent =
            nome;
    }

    if (has("metaValor2")) {
        $("metaValor2").textContent =
            valorTexto;
    }

    if (has("metaPercent2")) {
        $("metaPercent2").textContent =
            percentTexto;
    }

    if (has("metaBar2")) {
        $("metaBar2").value =
            percentual;
    }

    if (has("metaHint2")) {
        $("metaHint2").textContent =
            hint;
    }

    /* =========================
       DASHBOARD
    ========================= */

    if (has("metaNomeExibida")) {
        $("metaNomeExibida").textContent =
            nome;
    }

    if (has("metaValor")) {
        $("metaValor").textContent =
            valorTexto;
    }

    if (has("metaPercent")) {
        $("metaPercent").textContent =
            percentTexto;
    }

    if (has("metaBar")) {
        $("metaBar").value =
            percentual;
    }

    if (has("metaHint")) {
        $("metaHint").textContent =
            hint;
    }

    if (has("dashboardMetaTitulo")) {
        $("dashboardMetaTitulo").textContent =
            nome;
    }
}

}

function atualizarAlerta(saldo) {

if (!has("alert")) {
    return;
}

$("alert").className = "";
$("alert").innerHTML = "";

if (saldo < 0) {

    $("alert").classList.add(
        "alert",
        "redA"
    );

    $("alert").textContent =
        "⚠️ Seu saldo está negativo. Reveja seus gastos e prioridades.";

} else if (
    saldo <
    Number(meta.valor || 0) *
        0.2
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

function atualizarMeta(saldo) {

const valorMeta =
    Number(
        meta.valor || 0
    );

const progresso =
    valorMeta > 0
        ? Math.max(
            0,
            Math.min(
                saldo,
                valorMeta
            )
        )
        : 0;

const percentual =
    valorMeta > 0
        ? (progresso /
            valorMeta) *
            100
        : 0;

const nome =
    meta.titulo ||
    "Meta principal";

const valorTexto =
    `${format(
        progresso
    )} / ${format(
        valorMeta
    )}`;

const percentTexto =
    `${percentual.toFixed(
        1
    )}%`;

const hint =
    percentual >= 100
        ? "Meta atingida. Hora de definir o próximo objetivo."
        : `Faltam ${format(
            Math.max(
                valorMeta -
                progresso,
                0
            )
        )} para atingir sua meta.`;

if (has("metaInput")) {
    $("metaInput").value =
        valorMeta || "";
}

if (has("metaTitulo")) {
    $("metaTitulo").value =
        meta.titulo || "";
}

if (has("metaNomeExibida")) {
    $("metaNomeExibida").textContent =
        nome;
}

if (has("metaValor")) {
    $("metaValor").textContent =
        valorTexto;
}

if (has("metaPercent")) {
    $("metaPercent").textContent =
        percentTexto;
}

if (has("metaBar")) {
    $("metaBar").value =
        percentual;
}

if (has("metaHint")) {
    $("metaHint").textContent =
        hint;
}

if (has("metaNomeExibida2")) {
    $("metaNomeExibida2").textContent =
        nome;
}

if (has("metaValor2")) {
    $("metaValor2").textContent =
        valorTexto;
}

if (has("metaPercent2")) {
    $("metaPercent2").textContent =
        percentTexto;
}

if (has("metaBar2")) {
    $("metaBar2").value =
        percentual;
}

if (has("metaHint2")) {
    $("metaHint2").textContent =
        hint;
}

if (
    has("dashboardMetaTitulo")
) {
    $(
        "dashboardMetaTitulo"
    ).textContent =
        nome;
}

}

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
        .map(categoria => {

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
                        (gasto /
                            limite) *
                            100,
                        100
                    )
                    : 0;

            const excedeu =
                gasto > limite;

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
                            ${format(
                                gasto
                            )}
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
        })
        .join("");

}

function transacaoHtml(item) {

return `
    <div class="item">

        <div class="item-info">

            <div class="item-title-row">

                <strong>
                    ${item.descricao}
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

                ${item.categoria}

                •

                ${
                    item.dataFormatada ||
                    formatarData(
                        item.dataISO
                    )
                }

                •

                ${
                    item.pagamento ||
                    "Sem forma de pagamento"
                }

                ${
                    item.observacao
                        ? `<br>${item.observacao}`
                        : ""
                }

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
                title="Editar">
                ✏️
            </button>

            <button
                class="icon-btn delete-btn"
                onclick="removerItem(${item.id})"
                title="Remover">
                🗑️
            </button>

        </div>

    </div>
`;

}

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

$("dashboardTransactions").innerHTML =
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
    (currentPage - 1) *
    ITEMS_PER_PAGE;

const pagina =
    filtradas.slice(
        inicio,
        inicio +
            ITEMS_PER_PAGE
    );

$("transactionCounter").textContent =
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
    $("pagination").classList.toggle(
        "hidden",
        totalPages <= 1
    );
}

}

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
    alert(
        "Digite uma meta válida."
    );

    return;
}

meta = {
    titulo,
    valor
};

salvarMeta();
atualizarResumo();

alert(
    "Meta salva com sucesso."
);

}

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
    alert(
        "Selecione uma categoria."
    );

    return;
}

if (
    !valor ||
    valor <= 0
) {
    alert(
        "Digite um valor de limite válido."
    );

    return;
}

budgets[categoria] =
    valor;

salvarBudgets();

$("budgetValor").value =
    "";

atualizarBudgets();

}

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
    alert(
        "Digite uma descrição."
    );

    return;
}

if (
    !valor ||
    valor <= 0
) {
    alert(
        "Digite um valor válido."
    );

    return;
}

const dataISO =
    $("dataLancamento")
        .value;

if (!dataISO) {
    alert(
        "Selecione a data do lançamento."
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
        data.map(item =>
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
renderLancamentos();
renderDashboard();

}

function editarItem(id) {

if (!has("transactionForm")) {

    window.location.href =
        "lancamentos.html";

    return;
}

const item =
    data.find(
        x => x.id === id
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
    behavior: "smooth"
});

}

function removerItem(id) {

if (
    !confirm(
        "Deseja remover este lançamento?"
    )
) {
    return;
}

data =
    data.filter(
        item =>
            item.id !== id
    );

salvarDados();

atualizarResumo();
renderLancamentos();
renderDashboard();

}

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

function criarGrafico(
id,
config
) {

const canvas = $(id);

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
            (a, i) =>
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
            (a, i) =>
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
    .forEach(i => {

        cats[i.categoria] =
            (
                cats[
                    i.categoria
                ] || 0
            ) +
            Number(
                i.valor
            );
    });

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

data.forEach(i => {

    const chave =
        i.dataISO?.slice(
            0,
            7
        ) ||
        "Sem data";

    if (
        !mensal[chave]
    ) {
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
});

const keys =
    Object.keys(
        mensal
    ).sort();

const labels =
    keys.map(k =>
        k === "Sem data"
            ? k
            : getMonthNameKey(
                `${k}-01`
            )
    );

const saldos =
    keys.map(k =>
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
    .forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.page ===
                atual
        );
    });

}

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
].forEach(id => {

    if (has(id)) {

        $(id).addEventListener(
            "change",
            () => {

                currentPage = 1;

                renderLancamentos();
            }
        );
    }
});

}

function init() {

    normalizarDados();

    preencherCategorias();

    preencherMesesFiltro();

    setDefaultDate();

    bindEvents();

    marcarPaginaAtual();

    atualizarResumo();

    atualizarBudgets();

    renderLancamentos();

    renderDashboard();

    atualizarGraficos();

    animateBackground();
}

window.editarItem =
editarItem;

window.removerItem =
removerItem;

init();