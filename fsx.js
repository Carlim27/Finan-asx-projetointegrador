/* =========================================================
   FINANÇASX — JAVASCRIPT PRINCIPAL
   Versão compatível com os HTMLs atuais
========================================================= */

const STORAGE_KEY = "financasx_transacoes";
const GOAL_KEY = "financasx_meta";
const BUDGET_KEY = "financasx_orcamentos";


/* =========================================================
   CATEGORIAS
========================================================= */

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

const iconesCategorias = {
    "Geral": "📦",
    "Alimentação": "🍔",
    "Transporte": "🚗",
    "Lazer": "🎮",
    "Saúde": "❤️",
    "Educação": "📚",
    "Moradia": "🏠",
    "Assinaturas": "📱",
    "Investimentos": "📈",
    "Contas": "🧾",
    "Compras": "🛒"
};

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


/* =========================================================
   ESTADO
========================================================= */

let data = carregarJSON(
    STORAGE_KEY,
    []
);

let meta = carregarJSON(
    GOAL_KEY,
    {
        titulo: "Meta principal",
        valor: 5000
    }
);

let budgets = carregarJSON(
    BUDGET_KEY,
    {}
);

let currentPage = 1;

const ITEMS_PER_PAGE = 10;

let overviewChart = null;
let categoryChart = null;
let monthlyChart = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = id =>
    document.getElementById(id);

const has = id =>
    !!$(id);

function carregarJSON(chave, padrao) {

    try {

        const salvo =
            localStorage.getItem(chave);

        if (!salvo) {
            return padrao;
        }

        return JSON.parse(salvo);

    } catch (erro) {

        console.error(
            "Erro ao carregar:",
            chave,
            erro
        );

        return padrao;
    }
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


function format(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}


function escaparHtml(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


/* =========================================================
   NOTIFICAÇÃO
========================================================= */

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


/* =========================================================
   CONFIRMAÇÃO
========================================================= */

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

            <h3>Confirmar ação</h3>

            <p>
                ${escaparHtml(mensagem)}
            </p>

            <div class="fsx-confirmacao-acoes">

                <button
                    type="button"
                    class="fsx-confirmar-cancelar">
                    Cancelar
                </button>

                <button
                    type="button"
                    class="fsx-confirmar-ok">
                    Confirmar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        overlay
    );

    overlay
        .querySelector(
            ".fsx-confirmar-cancelar"
        )
        .addEventListener(
            "click",
            () => overlay.remove()
        );

    overlay
        .querySelector(
            ".fsx-confirmar-ok"
        )
        .addEventListener(
            "click",
            () => {

                overlay.remove();

                aoConfirmar();
            }
        );
}


/* =========================================================
   NORMALIZAR DADOS
========================================================= */

function normalizarDados() {

    if (!Array.isArray(data)) {
        data = [];
    }

    data = data.map(item => {

        const dataISO =
            item.dataISO ||
            new Date()
                .toISOString()
                .split("T")[0];

        return {

            id:
                item.id ||
                Date.now() +
                Math.random(),

            descricao:
                item.descricao ||
                "Sem descrição",

            valor:
                Number(item.valor) || 0,

            tipo:
                item.tipo === "entrada"
                    ? "entrada"
                    : "saida",

            categoria:
                categorias.includes(
                    item.categoria
                )
                    ? item.categoria
                    : "Geral",

            pagamento:
                item.pagamento ||
                "Pix",

            observacao:
                item.observacao ||
                "",

            dataISO,

            dataFormatada:
                formatarData(dataISO)
        };
    });

    salvarDados();
}


/* =========================================================
   DATAS
========================================================= */

function formatarData(valor) {

    if (!valor) {
        return "";
    }

    return new Date(
        `${valor}T12:00:00`
    ).toLocaleDateString(
        "pt-BR"
    );
}


function extrairMes(valor) {

    if (!valor) {
        return "";
    }

    const partes =
        valor.split("-");

    if (partes.length < 2) {
        return "";
    }

    return `${partes[1]}/${partes[0]}`;
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


/* =========================================================
   CATEGORIAS
========================================================= */

function preencherCategorias() {

    const htmlCategorias =
        categorias
            .map(categoria => {

                const icone =
                    iconesCategorias[
                        categoria
                    ] || "📦";

                return `
                    <option value="${escaparHtml(categoria)}">
                        ${icone} ${escaparHtml(categoria)}
                    </option>
                `;
            })
            .join("");


    if (has("cat")) {

        $("cat").innerHTML =
            htmlCategorias;
    }


    if (has("budgetCategoria")) {

        $("budgetCategoria").innerHTML =
            htmlCategorias;
    }


    if (has("filterCategoria")) {

        $("filterCategoria").innerHTML =
            `
            <option value="todas">
                Todas as categorias
            </option>
            ` +
            htmlCategorias;
    }
}


/* =========================================================
   MESES
========================================================= */

function preencherMesesFiltro() {

    if (!has("filterMes")) {
        return;
    }

    const atual =
        $("filterMes").value ||
        "todos";

    const meses = [
        ...new Set(
            data
                .map(item =>
                    extrairMes(
                        item.dataISO
                    )
                )
                .filter(Boolean)
        )
    ].sort();

    $("filterMes").innerHTML =
        `
        <option value="todos">
            Todos os meses
        </option>
        ` +
        meses
            .map(mes => `
                <option value="${mes}">
                    ${mes}
                </option>
            `)
            .join("");

    $("filterMes").value =
        meses.includes(atual)
            ? atual
            : "todos";
}


/* =========================================================
   FILTROS
========================================================= */

function obterFiltradas() {

    if (!Array.isArray(data)) {
        return [];
    }

    const termo = has("searchInput")
        ? $("searchInput").value.trim().toLowerCase()
        : "";

    const tipo = has("filterTipo")
        ? $("filterTipo").value
        : "todos";

    const categoria = has("filterCategoria")
        ? $("filterCategoria").value
        : "todas";

    const mes = has("filterMes")
        ? $("filterMes").value
        : "todos";

    return [...data]
        .filter(item => {

            // TIPO
            if (
                tipo &&
                tipo !== "todos" &&
                item.tipo !== tipo
            ) {
                return false;
            }

            // CATEGORIA
            if (
                categoria &&
                categoria !== "todas" &&
                item.categoria !== categoria
            ) {
                return false;
            }

            // MÊS
            if (
                mes &&
                mes !== "todos" &&
                extrairMes(item.dataISO) !== mes
            ) {
                return false;
            }

            // PESQUISA
            if (termo) {

                const texto = [
                    item.descricao,
                    item.categoria,
                    item.pagamento,
                    item.observacao
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!texto.includes(termo)) {
                    return false;
                }
            }

            return true;
        })
        .sort(
            (a, b) =>
                new Date(b.dataISO) -
                new Date(a.dataISO)
        );
}

/* =========================================================
   RESUMO FINANCEIRO
========================================================= */

function calcularResumo() {

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
                        item.valor || 0
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
                        item.valor || 0
                    ),
                0
            );

    return {
        entradas,
        saidas,
        saldo:
            entradas - saidas
    };
}


function atualizarResumo() {

    if (!has("saldo")) {
        return;
    }

    const resumo =
        calcularResumo();


    $("saldo").textContent =
        format(resumo.saldo);

    $("entradas").textContent =
        format(resumo.entradas);

    $("saidas").textContent =
        format(resumo.saidas);


    const taxa =
        resumo.entradas > 0
            ? (
                resumo.saldo /
                resumo.entradas
            ) * 100
            : 0;

    $("taxaPoupanca").textContent =
        `${Math.max(
            0,
            taxa
        ).toFixed(1)}%`;


    $("saldoStatus").textContent =
        resumo.saldo > 0
            ? "Seu saldo está positivo."
            : resumo.saldo < 0
                ? "Seu saldo exige atenção."
                : "Sem sobra financeira no momento.";


    const mesAtual =
        new Date()
            .toISOString()
            .slice(0, 7);

    const movimentacoesMes =
        data.filter(item =>
            item.dataISO &&
            item.dataISO.startsWith(
                mesAtual
            )
        );

    const entradasMes =
        movimentacoesMes
            .filter(
                item =>
                    item.tipo ===
                    "entrada"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(item.valor || 0),
                0
            );

    const saidasMes =
        movimentacoesMes
            .filter(
                item =>
                    item.tipo ===
                    "saida"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(item.valor || 0),
                0
            );


    if (has("economiaMes")) {

        $("economiaMes").textContent =
            format(
                entradasMes -
                saidasMes
            );
    }


    if (has("economiaStatus")) {

        $("economiaStatus").textContent =
            movimentacoesMes.length
                ? "Movimentações registradas neste mês."
                : "Sem dados neste mês.";
    }


    const maiorGasto =
        data
            .filter(
                item =>
                    item.tipo ===
                    "saida"
            )
            .sort(
                (a, b) =>
                    b.valor - a.valor
            )[0];


    if (has("maiorGasto")) {

        $("maiorGasto").textContent =
            maiorGasto
                ? format(
                    maiorGasto.valor
                )
                : format(0);
    }


    if (has("maiorGastoDesc")) {

        $("maiorGastoDesc").textContent =
            maiorGasto
                ? maiorGasto.descricao
                : "Nenhum gasto registrado";
    }


    atualizarMeta(
        resumo.saldo
    );
}


/* =========================================================
   META
========================================================= */

function atualizarMeta(
    saldo = null
) {

    if (saldo === null) {

        saldo =
            calcularResumo().saldo;
    }

    const valorMeta =
        Number(meta.valor || 0);

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
            ? (
                progresso /
                valorMeta
            ) * 100
            : 0;

    const nome =
        meta.titulo ||
        "Meta principal";

    const textoValor =
        `${format(progresso)} / ${format(valorMeta)}`;

    const textoPercentual =
        `${percentual.toFixed(1)}%`;

    const faltante =
        Math.max(
            valorMeta - progresso,
            0
        );


    const hint =
        percentual >= 100
            ? "Meta atingida. Hora de definir o próximo objetivo."
            : `Faltam ${format(
                faltante
            )} para atingir sua meta.`;


    if (has("metaInput")) {

        $("metaInput").value =
            valorMeta || "";
    }

    if (has("metaTitulo")) {

        $("metaTitulo").value =
            nome;
    }


    atualizarElemento(
        "metaNomeExibida",
        nome
    );

    atualizarElemento(
        "metaNomeExibida2",
        nome
    );

    atualizarElemento(
        "dashboardMetaTitulo",
        nome
    );


    atualizarElemento(
        "metaValor",
        textoValor
    );

    atualizarElemento(
        "metaValor2",
        textoValor
    );


    atualizarElemento(
        "metaPercent",
        textoPercentual
    );

    atualizarElemento(
        "metaPercent2",
        textoPercentual
    );


    atualizarElemento(
        "metaHint",
        hint
    );

    atualizarElemento(
        "metaHint2",
        hint
    );


    if (has("metaBar")) {

        $("metaBar").value =
            percentual;
    }

    if (has("metaBar2")) {

        $("metaBar2").value =
            percentual;
    }
}


function atualizarElemento(
    id,
    valor
) {

    if (has(id)) {

        $(id).textContent =
            valor;
    }
}


/* =========================================================
   SALVAR META
========================================================= */

function salvarMetaHandler() {

    if (
        !has("metaInput") ||
        !has("metaTitulo")
    ) {
        return;
    }

    const valor =
        Number(
            $("metaInput").value
        );

    const titulo =
        $("metaTitulo")
            .value
            .trim() ||
        "Meta principal";


    if (!valor || valor <= 0) {

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
        "Meta salva com sucesso.",
        "sucesso"
    );
}


/* =========================================================
   ORÇAMENTO
========================================================= */

function salvarBudgetHandler() {

    if (
        !has("budgetCategoria") ||
        !has("budgetValor")
    ) {
        return;
    }

    const categoria =
        $("budgetCategoria").value;

    const valor =
        Number(
            $("budgetValor").value
        );

    if (!categoria) {

        mostrarNotificacao(
            "Selecione uma categoria.",
            "erro"
        );

        return;
    }

    if (!valor || valor <= 0) {

        mostrarNotificacao(
            "Digite um valor de orçamento válido.",
            "erro"
        );

        return;
    }

    budgets[categoria] = valor;

    salvarBudgets();

    $("budgetValor").value = "";

    atualizarBudgets();

    mostrarNotificacao(
        "Orçamento salvo com sucesso.",
        "sucesso"
    );
}

function atualizarBudgets() {

    if (!has("budgetList")) {
        return;
    }

    const categoriasOrcadas =
        Object.keys(budgets);

    if (!categoriasOrcadas.length) {

        $("budgetList").innerHTML = `
            <div class="empty-state">
                Nenhum orçamento configurado.
            </div>
        `;

        return;
    }

    const agora = new Date();

    const mesAtual =
        `${agora.getFullYear()}-${String(
            agora.getMonth() + 1
        ).padStart(2, "0")}`;

    $("budgetList").innerHTML =
        categoriasOrcadas
            .map(categoria => {

                const limite =
                    Number(budgets[categoria]) || 0;

                const gasto =
                    data
                        .filter(item =>
                            item.tipo === "saida" &&
                            item.categoria === categoria &&
                            item.dataISO &&
                            item.dataISO.startsWith(mesAtual)
                        )
                        .reduce(
                            (total, item) =>
                                total +
                                Number(item.valor || 0),
                            0
                        );

                const percentualReal =
                    limite > 0
                        ? (gasto / limite) * 100
                        : 0;

                const percentualBarra =
                    Math.min(
                        100,
                        percentualReal
                    );

                const restante =
                    limite - gasto;

                let status =
                    "normal";

                let mensagem =
                    `Restante: ${format(restante)}`;

                if (percentualReal >= 100) {

                    status =
                        "estourado";

                    mensagem =
                        `Acima em ${format(
                            Math.abs(restante)
                        )}`;

                } else if (
                    percentualReal >= 80
                ) {

                    status =
                        "atencao";

                    mensagem =
                        `Restante: ${format(
                            restante
                        )}`;
                }

                const icone =
                    iconesCategorias[categoria] ||
                    "📦";

                return `
                    <div class="budget-item ${status}">

                        <div class="budget-head">

                            <strong>
                                ${icone}
                                ${escaparHtml(categoria)}
                            </strong>

                            <span>
                                ${percentualReal.toFixed(1)}%
                            </span>

                        </div>

                        <progress
                            value="${percentualBarra}"
                            max="100">
                        </progress>

                        <div class="budget-meta">

                            <span>
                                Gasto:
                                ${format(gasto)}
                            </span>

                            <span>
                                Limite:
                                ${format(limite)}
                            </span>

                            <span>
                                ${mensagem}
                            </span>

                        </div>

<div class="budget-actions">

    <button
        type="button"
        class="btn-edit"
        onclick="editarBudget('${categoria}')">
        ✏️ Editar
    </button>

    <button
        type="button"
        class="btn-delete"
        onclick="removerBudget('${categoria}')">
        🗑️ Excluir
    </button>

</div>

                    </div>
                `;
            })
            .join("");
}

function editarBudget(categoria) {

    if (
        !has("budgetCategoria") ||
        !has("budgetValor")
    ) {
        return;
    }

    const valor =
        Number(budgets[categoria]) || 0;

    $("budgetCategoria").value =
        categoria;

    $("budgetValor").value =
        valor;

    $("budgetValor").focus();

    mostrarNotificacao(
        `Editando orçamento de ${categoria}.`,
        "sucesso"
    );
}


function removerBudget(categoria) {

    if (budgets[categoria] === undefined) {
        return;
    }

    const modal = document.createElement("div");

    modal.className = "fsx-modal-overlay";

    modal.innerHTML = `
        <div class="fsx-modal">

            <div class="fsx-modal-icon">
                🗑️
            </div>

            <div class="fsx-modal-content">

                <h3>Excluir orçamento?</h3>

                <p>
                    Tem certeza que deseja excluir o orçamento
                    de <strong>${escaparHtml(categoria)}</strong>?
                </p>

                <span>
                    Essa ação não poderá ser desfeita.
                </span>

            </div>

            <div class="fsx-modal-actions">

                <button
                    type="button"
                    class="fsx-btn-cancel"
                    onclick="fecharModalBudget()">
                    Cancelar
                </button>

                <button
                    type="button"
                    class="fsx-btn-delete"
                    onclick="confirmarExclusaoBudget('${escaparHtml(categoria)}')">
                    Excluir
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
}


function fecharModalBudget() {

    const modal =
        document.querySelector(".fsx-modal-overlay");

    if (modal) {
        modal.remove();
    }
}


function confirmarExclusaoBudget(categoria) {

    if (budgets[categoria] === undefined) {
        fecharModalBudget();
        return;
    }

    delete budgets[categoria];

    salvarBudgets();

    atualizarBudgets();

    fecharModalBudget();

    mostrarNotificacao(
        "Orçamento excluído com sucesso.",
        "sucesso"
    );
}

/* =========================================================
   LANÇAMENTOS
========================================================= */

function salvarLancamento(e) {

    if (e) {
        e.preventDefault();
    }


    if (
        !has("descricao") ||
        !has("valor") ||
        !has("tipo") ||
        !has("cat") ||
        !has("dataLancamento")
    ) {

        mostrarNotificacao(
            "Formulário de lançamento incompleto.",
            "erro"
        );

        return;
    }


    const descricao =
        $("descricao")
            .value
            .trim();

    const valor =
        Number(
            $("valor").value
        );

    const tipo =
        $("tipo").value;

    const categoria =
        $("cat").value;

    const dataISO =
        $("dataLancamento").value;

    const pagamento =
        has("pagamento")
            ? $("pagamento").value
            : "Pix";

    const observacao =
        has("obs")
            ? $("obs").value.trim()
            : has("observacao")
                ? $("observacao")
                    .value
                    .trim()
                : "";


    if (!descricao) {

        mostrarNotificacao(
            "Digite uma descrição.",
            "erro"
        );

        return;
    }


    if (!valor || valor <= 0) {

        mostrarNotificacao(
            "Digite um valor válido.",
            "erro"
        );

        return;
    }


    if (!dataISO) {

        mostrarNotificacao(
            "Informe a data.",
            "erro"
        );

        return;
    }


    const editId =
        obterIdEdicao();


    const indice =
        editId
            ? data.findIndex(
                item =>
                    String(item.id) ===
                    String(editId)
            )
            : -1;


    const item = {

        id:
            indice >= 0
                ? data[indice].id
                : Date.now() +
                  Math.random(),

        descricao,

        valor,

        tipo:
            tipo === "entrada"
                ? "entrada"
                : "saida",

        categoria:
            categorias.includes(categoria)
                ? categoria
                : "Geral",

        pagamento,

        observacao,

        dataISO,

        dataFormatada:
            formatarData(dataISO)
    };


    if (indice >= 0) {

        data[indice] =
            item;

    } else {

        data.push(item);
    }


    salvarDados();

    preencherMesesFiltro();

    atualizarResumo();

    atualizarBudgets();

    renderLancamentos();

    renderDashboard();

    atualizarGraficos();

    atualizarFiscal();

    limparFormulario();


    mostrarNotificacao(
        indice >= 0
            ? "Lançamento atualizado com sucesso."
            : "Lançamento adicionado com sucesso.",
        "sucesso"
    );
}


/* =========================================================
   ID DE EDIÇÃO
========================================================= */

function obterIdEdicao() {

    if (has("editId")) {

        return $("editId").value;
    }

    if (has("editingId")) {

        return $("editingId").value;
    }

    return "";
}


/* =========================================================
   EDITAR
========================================================= */

function editarItem(id) {

    const item = data.find(
        registro =>
            String(registro.id) === String(id)
    );

    if (!item) {
        mostrarNotificacao(
            "Lançamento não encontrado.",
            "erro"
        );
        return;
    }


    // DESCRIÇÃO
    if (has("descricao")) {
        $("descricao").value =
            item.descricao || "";
    } else if (has("desc")) {
        $("desc").value =
            item.descricao || "";
    }


    // VALOR
    if (has("valor")) {
        $("valor").value =
            item.valor || "";
    }


    // TIPO
    if (has("tipo")) {
        $("tipo").value =
            item.tipo || "saida";
    }


    // CATEGORIA
    if (has("cat")) {
        $("cat").value =
            item.categoria || "Geral";
    }


    // PAGAMENTO
    if (has("pagamento")) {
        $("pagamento").value =
            item.pagamento || "Pix";
    }


    // DATA
    if (has("dataLancamento")) {
        $("dataLancamento").value =
            item.dataISO || "";
    }


    // OBSERVAÇÃO
    if (has("observacao")) {

        $("observacao").value =
            item.observacao || "";

    } else if (has("obs")) {

        $("obs").value =
            item.observacao || "";
    }


    // ID DO LANÇAMENTO
    if (has("editId")) {
        $("editId").value =
            item.id;
    }

    if (has("editingId")) {
        $("editingId").value =
            item.id;
    }


    // ALTERA BOTÃO
    if (has("submitBtn")) {
        $("submitBtn").textContent =
            "Atualizar lançamento";
    }


    // MOSTRA CANCELAR
    if (has("cancelEditBtn")) {
        $("cancelEditBtn").style.display =
            "inline-flex";
    }

    if (has("cancelEdit")) {
        $("cancelEdit").style.display =
            "inline-flex";
    }


    // VOLTA PARA O FORMULÁRIO
    const form =
        $("transactionForm");

    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    
    mostrarNotificacao(
        "Editando lançamento...",
        "sucesso"
    );
}
function irParaEdicao(id){
    window.location.href = 'lancamentos.html?editar=${encodeURIcomponent(id)}';
}
function abrirEdicaoPeloUrl() {
    if (!has("transactionForm")) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("editar");

    if (!id) return;

    editarItem(id);

    // Limpa a URL depois de carregar a edição
    history.replaceState({}, document.title, "lancamentos.html");
}

/* =========================================================
   EXCLUIR
========================================================= */

function removerItem(id) {

    const item =
        data.find(
            registro =>
                String(registro.id) ===
                String(id)
        );


    if (!item) {

        mostrarNotificacao(
            "Lançamento não encontrado.",
            "erro"
        );

        return;
    }


    mostrarConfirmacao(
        `Deseja excluir "${item.descricao}"?`,
        () => {

            data =
                data.filter(
                    registro =>
                        String(registro.id) !==
                        String(id)
                );

            salvarDados();

            preencherMesesFiltro();

            atualizarResumo();

            atualizarBudgets();

            renderLancamentos();

            renderDashboard();

            atualizarGraficos();

            atualizarFiscal();

            mostrarNotificacao(
                "Lançamento excluído.",
                "sucesso"
            );
        }
    );
}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function limparFormulario() {

    const form =
        $("transactionForm");

    if (form) {

        form.reset();
    }


    if (has("editId")) {

        $("editId").value =
            "";
    }

    if (has("editingId")) {

        $("editingId").value =
            "";
    }


    setDefaultDate();


    if (has("submitBtn")) {

        $("submitBtn").textContent =
            "Adicionar lançamento";
    }


    if (has("cancelEditBtn")) {

        $("cancelEditBtn").style.display =
            "none";
    }

    if (has("cancelEdit")) {

        $("cancelEdit").style.display =
            "none";
    }
}


/* =========================================================
   HTML DA TRANSAÇÃO
========================================================= */

function transacaoHtml(item) {
    const icone = iconesCategorias[item.categoria] || "📦";

    const estaNaPaginaLancamentos =
        window.location.pathname.toLowerCase().includes("lancamentos.html");

    const acaoEditar = estaNaPaginaLancamentos
        ? `editarItem(${item.id})`
        : `irParaEdicao(${item.id})`;

    return `
        <div class="item">

            <div class="item-info">

                <div class="item-title-row">

                    <strong class="item-title">
                        ${escaparHtml(item.descricao)}
                    </strong>

                    <span class="badge ${item.tipo}">
                        ${item.tipo === "entrada" ? "Entrada" : "Saída"}
                    </span>

                </div>

                <div class="small">
                    ${icone}
                    ${escaparHtml(item.categoria)}
                    • ${escaparHtml(item.dataFormatada)}
                    • ${escaparHtml(item.pagamento || "Pix")}

                    ${
                        item.observacao
                            ? `<br>${escaparHtml(item.observacao)}`
                            : ""
                    }
                </div>

            </div>

            <div class="item-value">

                <span class="${item.tipo === "entrada" ? "green" : "red"}">
                    ${item.tipo === "entrada" ? "+" : "-"}
                    ${format(item.valor)}
                </span>

                <button
                    class="icon-btn edit-btn"
                    type="button"
                    onclick="${acaoEditar}"
                    title="Editar lançamento"
                    aria-label="Editar lançamento">
                    ✏️
                </button>

                <button
                    class="icon-btn delete-btn"
                    type="button"
                    onclick="removerItem(${item.id})"
                    title="Excluir lançamento"
                    aria-label="Excluir lançamento">
                    🗑️
                </button>

            </div>

        </div>
    `;
}

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    if (!has("dashboardTransactions")) {
        return;
    }

    const recentes =
        [...data]
            .sort(
                (a, b) =>
                    new Date(b.dataISO) -
                    new Date(a.dataISO)
            )
            .slice(0, 4);


    $("dashboardTransactions").innerHTML =
        recentes.length
            ? recentes
                .map(transacaoHtml)
                .join("")
            : `
                <div class="empty-state">
                    Ainda não há lançamentos registrados.
                </div>
            `;
}


/* =========================================================
   LISTA DE LANÇAMENTOS
========================================================= */

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


    $("list").innerHTML =
        pagina.length
            ? pagina
                .map(transacaoHtml)
                .join("")
            : `
                <div class="empty-state">
                    Nenhum lançamento encontrado.
                </div>
            `;


    if (has("transactionCounter")) {

        $("transactionCounter").textContent =
            `${filtradas.length} ${
                filtradas.length === 1
                    ? "item"
                    : "itens"
            }`;
    }


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
            currentPage >= totalPages;
    }


    if (has("pagination")) {

        $("pagination").classList.toggle(
            "hidden",
            totalPages <= 1
        );
    }
}


/* =========================================================
   PAGINAÇÃO
========================================================= */

function paginaAnterior() {

    if (currentPage > 1) {

        currentPage--;

        renderLancamentos();
    }
}


function proximaPagina() {

    const total =
        obterFiltradas().length;

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                total /
                ITEMS_PER_PAGE
            )
        );


    if (
        currentPage <
        totalPages
    ) {

        currentPage++;

        renderLancamentos();
    }
}


/* =========================================================
   LIMPAR FILTROS
========================================================= */

function limparFiltros() {

    if (has("searchInput")) {

        $("searchInput").value =
            "";
    }

    if (has("filterTipo")) {

        $("filterTipo").value =
            "todos";
    }

    if (has("filterCategoria")) {

        $("filterCategoria").value =
            "todas";
    }

    if (has("filterMes")) {

        $("filterMes").value =
            "todos";
    }


    currentPage = 1;

    renderLancamentos();
}


/* =========================================================
   GRÁFICOS
========================================================= */

function destruirGrafico(
    grafico
) {

    if (!grafico) {
        return;
    }

    try {

        grafico.destroy();

    } catch (erro) {

        console.warn(
            "Erro ao destruir gráfico:",
            erro
        );
    }
}


function atualizarGraficos() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js não foi carregado."
        );

        return;
    }


    const resumo =
        calcularResumo();


    /* -----------------------------------------
       VISÃO GERAL
    ----------------------------------------- */

    if (has("overviewChart")) {

        destruirGrafico(
            overviewChart
        );


        overviewChart =
            new Chart(
                $("overviewChart"),
                {
                    type: "doughnut",

                    data: {

                        labels: [
                            "Entradas",
                            "Saídas"
                        ],

                        datasets: [

                            {
                                data: [
                                    resumo.entradas,
                                    resumo.saidas
                                ],

                                backgroundColor: [
                                    "#22c55e",
                                    "#ef4444"
                                ],

                                borderWidth: 0
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        plugins: {

                            legend: {

                                position:
                                    "bottom",

                                labels: {

                                    color:
                                        "#dbeafe"
                                }
                            }
                        }
                    }
                }
            );
    }


    /* -----------------------------------------
       CATEGORIAS
    ----------------------------------------- */

    if (has("categoryChart")) {

        destruirGrafico(
            categoryChart
        );


        const valores =
            categorias.map(
                categoria =>

                    data
                        .filter(
                            item =>
                                item.tipo ===
                                    "saida" &&
                                item.categoria ===
                                    categoria
                        )
                        .reduce(
                            (total, item) =>
                                total +
                                Number(
                                    item.valor || 0
                                ),
                            0
                        )
            );


        categoryChart =
            new Chart(
                $("categoryChart"),
                {
                    type: "bar",

                    data: {

                        labels:
                            categorias,

                        datasets: [

                            {
                                label:
                                    "Gastos",

                                data:
                                    valores,

                                backgroundColor:
                                    coresCategorias,

                                borderRadius:
                                    8,

                                borderWidth:
                                    0
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        scales: {

                            x: {

                                ticks: {
                                    color:
                                        "#9fb3d1"
                                },

                                grid: {
                                    display:
                                        false
                                }
                            },

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    color:
                                        "#9fb3d1",

                                    callback:
                                        valor =>
                                            format(
                                                valor
                                            )
                                },

                                grid: {

                                    color:
                                        "rgba(148,163,184,.10)"
                                }
                            }
                        },

                        plugins: {

                            legend: {
                                display:
                                    false
                            }
                        }
                    }
                }
            );
    }


    /* -----------------------------------------
       EVOLUÇÃO MENSAL
    ----------------------------------------- */

    if (has("monthlyChart")) {

        destruirGrafico(
            monthlyChart
        );


        const meses = {};


        data.forEach(item => {

            if (!item.dataISO) {
                return;
            }


            const chave =
                item.dataISO.slice(
                    0,
                    7
                );


            if (!meses[chave]) {

                meses[chave] = {
                    entradas: 0,
                    saidas: 0
                };
            }


            if (
                item.tipo ===
                "entrada"
            ) {

                meses[chave]
                    .entradas +=
                    Number(
                        item.valor || 0
                    );

            } else {

                meses[chave]
                    .saidas +=
                    Number(
                        item.valor || 0
                    );
            }
        });


        const chaves =
            Object.keys(
                meses
            ).sort();


        const labels =
            chaves.map(
                chave => {

                    const partes =
                        chave.split("-");

                    return new Date(
                        Number(partes[0]),
                        Number(partes[1]) - 1,
                        1
                    ).toLocaleDateString(
                        "pt-BR",
                        {
                            month: "short",
                            year: "numeric"
                        }
                    );
                }
            );


        monthlyChart =
            new Chart(
                $("monthlyChart"),
                {
                    type: "line",

                    data: {

                        labels,

                        datasets: [

                            {
                                label:
                                    "Entradas",

                                data:
                                    chaves.map(
                                        mes =>
                                            meses[mes]
                                                .entradas
                                    ),

                                borderColor:
                                    "#22c55e",

                                backgroundColor:
                                    "rgba(34,197,94,.10)",

                                tension:
                                    .35,

                                fill:
                                    true
                            },

                            {
                                label:
                                    "Saídas",

                                data:
                                    chaves.map(
                                        mes =>
                                            meses[mes]
                                                .saidas
                                    ),

                                borderColor:
                                    "#ef4444",

                                backgroundColor:
                                    "rgba(239,68,68,.10)",

                                tension:
                                    .35,

                                fill:
                                    true
                            }
                        ]
                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio:
                            false,

                        interaction: {

                            mode:
                                "index",

                            intersect:
                                false
                        },

                        scales: {

                            x: {

                                ticks: {
                                    color:
                                        "#9fb3d1"
                                },

                                grid: {
                                    display:
                                        false
                                }
                            },

                            y: {

                                beginAtZero:
                                    true,

                                ticks: {

                                    color:
                                        "#9fb3d1",

                                    callback:
                                        valor =>
                                            format(
                                                valor
                                            )
                                },

                                grid: {

                                    color:
                                        "rgba(148,163,184,.10)"
                                }
                            }
                        },

                        plugins: {

                            legend: {

                                labels: {
                                    color:
                                        "#dbeafe"
                                }
                            }
                        }
                    }
                }
            );
    }
}


/* =========================================================
   FISCAL
========================================================= */

function atualizarFiscal() {

    if (!has("fiscalReceitas")) {
        return;
    }


    const ano =
        has("anoFiscal")
            ? $("anoFiscal").value
            : String(
                new Date()
                    .getFullYear()
            );


    const registros =
        data.filter(
            item =>
                item.dataISO &&
                item.dataISO.startsWith(
                    `${ano}-`
                )
        );


    const receitas =
        registros
            .filter(
                item =>
                    item.tipo ===
                    "entrada"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.valor || 0
                    ),
                0
            );


    const despesas =
        registros
            .filter(
                item =>
                    item.tipo ===
                    "saida"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.valor || 0
                    ),
                0
            );


    const investimentos =
        registros
            .filter(
                item =>
                    item.tipo ===
                        "saida" &&
                    item.categoria ===
                        "Investimentos"
            )
            .reduce(
                (total, item) =>
                    total +
                    Number(
                        item.valor || 0
                    ),
                0
            );


    atualizarElemento(
        "fiscalReceitas",
        format(receitas)
    );

    atualizarElemento(
        "fiscalDespesas",
        format(despesas)
    );

    atualizarElemento(
        "fiscalInvestimentos",
        format(investimentos)
    );

    atualizarElemento(
        "fiscalMovimentacoes",
        registros.length
    );


    atualizarElemento(
        "fiscalResumoReceitas",
        format(receitas)
    );

    atualizarElemento(
        "fiscalResumoDespesas",
        format(despesas)
    );

    atualizarElemento(
        "fiscalResumoInvestimentos",
        format(investimentos)
    );

    atualizarElemento(
        "fiscalResumoMovimentacoes",
        registros.length
    );
}


/* =========================================================
   MENU / NAVEGAÇÃO
========================================================= */

function configurarNavegacao() {

    const toggle =
        $("mobileMenuToggle");

    const nav =
        $("fsxMobileNav");


    if (
        toggle &&
        nav &&
        !toggle.dataset.fsxLigado
    ) {

        toggle.dataset.fsxLigado =
            "true";


        toggle.addEventListener(
            "click",
            e => {

                e.preventDefault();

                e.stopPropagation();


                const aberto =
                    nav.classList.toggle(
                        "menu-open"
                    );


                toggle.setAttribute(
                    "aria-expanded",
                    aberto
                        ? "true"
                        : "false"
                );


                toggle.setAttribute(
                    "aria-label",
                    aberto
                        ? "Fechar menu"
                        : "Abrir menu"
                );


                toggle.textContent =
                    aberto
                        ? "✕"
                        : "☰";
            }
        );
    }


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(link => {

            if (
                link.dataset.fsxLigado
            ) {
                return;
            }

            link.dataset.fsxLigado =
                "true";


            link.addEventListener(
                "click",
                e => {

                    e.preventDefault();


                    const destino =
                        link.getAttribute(
                            "href"
                        );


                    if (!destino) {
                        return;
                    }


                    if (nav) {

                        nav.classList.remove(
                            "menu-open"
                        );
                    }


                    if (toggle) {

                        toggle.textContent =
                            "☰";

                        toggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }


                    document.body
                        .classList.add(
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
        });
}


/* =========================================================
   PÁGINA ATUAL
========================================================= */

function marcarPaginaAtual() {

    let atual =
        location.pathname
            .split("/")
            .pop();


    if (
        !atual ||
        atual === "/"
    ) {

        atual =
            "index.html";
    }


    document
        .querySelectorAll(
            ".nav-btn"
        )
        .forEach(link => {

            const destino =
                link.getAttribute(
                    "href"
                );


            link.classList.toggle(
                "active",
                destino === atual
            );
        });
}


/* =========================================================
   EVENTOS
========================================================= */

function bindEvents() {

    configurarNavegacao();


    /* -----------------------------------------
       LANÇAMENTOS
    ----------------------------------------- */

    if (
        has("transactionForm") &&
        !$("transactionForm")
            .dataset.fsxLigado
    ) {

        $("transactionForm")
            .dataset.fsxLigado =
            "true";


        $("transactionForm")
            .addEventListener(
                "submit",
                salvarLancamento
            );
    }


    if (has("cancelEditBtn")) {

        $("cancelEditBtn")
            .addEventListener(
                "click",
                limparFormulario
            );
    }


    if (has("cancelEdit")) {

        $("cancelEdit")
            .addEventListener(
                "click",
                limparFormulario
            );
    }


    /* -----------------------------------------
       META
    ----------------------------------------- */

    if (has("saveGoalBtn")) {

        $("saveGoalBtn")
            .addEventListener(
                "click",
                salvarMetaHandler
            );
    }


    if (has("saveGoal")) {

        $("saveGoal")
            .addEventListener(
                "click",
                salvarMetaHandler
            );
    }


    if (has("goalForm")) {

        $("goalForm")
            .addEventListener(
                "submit",
                e => {

                    e.preventDefault();

                    salvarMetaHandler();
                }
            );
    }


    /* -----------------------------------------
       ORÇAMENTO
    ----------------------------------------- */

    if (has("saveBudgetBtn")) {

        $("saveBudgetBtn")
            .addEventListener(
                "click",
                salvarBudgetHandler
            );
    }


    if (has("saveBudget")) {

        $("saveBudget")
            .addEventListener(
                "click",
                salvarBudgetHandler
            );
    }


    if (has("budgetForm")) {

        $("budgetForm")
            .addEventListener(
                "submit",
                e => {

                    e.preventDefault();

                    salvarBudgetHandler();
                }
            );
    }


    /* -----------------------------------------
       FILTROS
    ----------------------------------------- */

    [
        "searchInput",
        "filterTipo",
        "filterCategoria",
        "filterMes"
    ].forEach(id => {

        if (!has(id)) {
            return;
        }


        $(id).addEventListener(
            "input",
            () => {

                currentPage = 1;

                renderLancamentos();
            }
        );


        $(id).addEventListener(
            "change",
            () => {

                currentPage = 1;

                renderLancamentos();
            }
        );
    });


    /* -----------------------------------------
       LIMPAR FILTROS
    ----------------------------------------- */

    if (has("clearFiltersBtn")) {

        $("clearFiltersBtn")
            .addEventListener(
                "click",
                limparFiltros
            );
    }


    if (has("clearFilters")) {

        $("clearFilters")
            .addEventListener(
                "click",
                limparFiltros
            );
    }


    if (has("limparFiltros")) {

        $("limparFiltros")
            .addEventListener(
                "click",
                limparFiltros
            );
    }


    /* -----------------------------------------
       PAGINAÇÃO
    ----------------------------------------- */

    if (has("prevPageBtn")) {

        $("prevPageBtn")
            .addEventListener(
                "click",
                paginaAnterior
            );
    }


    if (has("nextPageBtn")) {

        $("nextPageBtn")
            .addEventListener(
                "click",
                proximaPagina
            );
    }


    /* -----------------------------------------
       FISCAL
    ----------------------------------------- */

    if (has("anoFiscal")) {

        $("anoFiscal")
            .addEventListener(
                "change",
                atualizarFiscal
            );
    }
}


/* =========================================================
   FUNDO ANIMADO
========================================================= */

function animateBackground() {

    const canvas =
        $("bg");

    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");

    if (!ctx) {
        return;
    }


    let width =
        window.innerWidth;

    let height =
        window.innerHeight;


    const pontos = [];


    const quantidade =
        Math.min(
            45,
            Math.max(
                18,
                Math.floor(
                    width / 35
                )
            )
        );


    function redimensionar() {

        width =
            window.innerWidth;

        height =
            window.innerHeight;

        canvas.width =
            width;

        canvas.height =
            height;
    }


    for (
        let i = 0;
        i < quantidade;
        i++
    ) {

        pontos.push({

            x:
                Math.random() *
                width,

            y:
                Math.random() *
                height,

            vx:
                (
                    Math.random() -
                    .5
                ) * .25,

            vy:
                (
                    Math.random() -
                    .5
                ) * .25,

            raio:
                Math.random() *
                1.8 + .5
        });
    }


    function desenhar() {

        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        pontos.forEach(
            ponto => {

                ponto.x +=
                    ponto.vx;

                ponto.y +=
                    ponto.vy;


                if (
                    ponto.x < 0 ||
                    ponto.x > width
                ) {

                    ponto.vx *= -1;
                }


                if (
                    ponto.y < 0 ||
                    ponto.y > height
                ) {

                    ponto.vy *= -1;
                }


                ctx.beginPath();

                ctx.arc(
                    ponto.x,
                    ponto.y,
                    ponto.raio,
                    0,
                    Math.PI * 2
                );

                ctx.fillStyle =
                    "rgba(56,189,248,.20)";

                ctx.fill();
            }
        );


        requestAnimationFrame(
            desenhar
        );
    }


    redimensionar();


    window.addEventListener(
        "resize",
        redimensionar
    );


    desenhar();
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function init() {

    try {

        normalizarDados();

        preencherCategorias();

        preencherMesesFiltro();

        setDefaultDate();

        bindEvents();

        marcarPaginaAtual();

        atualizarResumo();

        atualizarMeta();

        atualizarBudgets();

        renderLancamentos();

        renderDashboard();

        atualizarGraficos();

        atualizarFiscal();

        animateBackground();

        abrirEdicaoPeloUrl();

        console.log(
            "FinançaSX iniciado corretamente."
        );


    } catch (erro) {

        console.error(
            "Erro ao iniciar FinançaSX:",
            erro
        );


        mostrarNotificacao(
            "Erro ao carregar o FinançaSX.",
            "erro"
        );
    }
}


/* =========================================================
   FUNÇÕES GLOBAIS
========================================================= */

window.editarItem =
    editarItem;

window.irParaEdicao =
    irParaEdicao;

window.removerItem =
    removerItem;

window.salvarLancamento =
    salvarLancamento;

window.limparFormulario =
    limparFormulario;

    window.editarBudget = 
    editarBudget;

    window.removerBudget = 
    removerBudget;

/* =========================================================
   INICIAR
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}