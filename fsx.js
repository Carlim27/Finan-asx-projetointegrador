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

let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let meta = JSON.parse(localStorage.getItem(GOAL_KEY)) || {
    titulo: "Meta principal",
    valor: 5000
};
let budgets = JSON.parse(localStorage.getItem(BUDGET_KEY)) || {};

let overviewChart = null;
let categoryChart = null;
let monthlyChart = null;

const elements = {
    saldo: document.getElementById("saldo"),
    entradas: document.getElementById("entradas"),
    saidas: document.getElementById("saidas"),
    economiaMes: document.getElementById("economiaMes"),
    taxaPoupanca: document.getElementById("taxaPoupanca"),
    maiorGasto: document.getElementById("maiorGasto"),
    maiorGastoDesc: document.getElementById("maiorGastoDesc"),
    saldoStatus: document.getElementById("saldoStatus"),
    economiaStatus: document.getElementById("economiaStatus"),
    alert: document.getElementById("alert"),
    metaInput: document.getElementById("metaInput"),
    metaTitulo: document.getElementById("metaTitulo"),
    metaNomeExibida: document.getElementById("metaNomeExibida"),
    metaValor: document.getElementById("metaValor"),
    metaPercent: document.getElementById("metaPercent"),
    metaHint: document.getElementById("metaHint"),
    metaBar: document.getElementById("metaBar"),
    budgetCategoria: document.getElementById("budgetCategoria"),
    budgetValor: document.getElementById("budgetValor"),
    budgetList: document.getElementById("budgetList"),
    form: document.getElementById("transactionForm"),
    editId: document.getElementById("editId"),
    desc: document.getElementById("desc"),
    valor: document.getElementById("valor"),
    tipo: document.getElementById("tipo"),
    cat: document.getElementById("cat"),
    pagamento: document.getElementById("pagamento"),
    dataLancamento: document.getElementById("dataLancamento"),
    obs: document.getElementById("obs"),
    submitBtn: document.getElementById("submitBtn"),
    cancelEditBtn: document.getElementById("cancelEditBtn"),
    searchInput: document.getElementById("searchInput"),
    filterTipo: document.getElementById("filterTipo"),
    filterCategoria: document.getElementById("filterCategoria"),
    filterMes: document.getElementById("filterMes"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    list: document.getElementById("list"),
    transactionCounter: document.getElementById("transactionCounter"),
    exportJsonBtn: document.getElementById("exportJsonBtn"),
    importFile: document.getElementById("importFile"),
    saveGoalBtn: document.getElementById("saveGoalBtn"),
    saveBudgetBtn: document.getElementById("saveBudgetBtn")
};

function format(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function salvarDados() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function salvarMeta() {
    localStorage.setItem(GOAL_KEY, JSON.stringify(meta));
}

function salvarBudgets() {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));
}

function formatarData(valor) {
    if (!valor) return new Date().toLocaleDateString("pt-BR");
    return new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR");
}

function extrairMes(valor) {
    if (!valor) return "Sem data";
    const [ano, mes] = valor.split("-");
    return `${mes}/${ano}`;
}

function getMonthNameKey(valor) {
    if (!valor) return "Sem data";
    const date = new Date(`${valor}T12:00:00`);
    return date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric"
    });
}

function preencherCategorias() {
    [elements.cat, elements.budgetCategoria].forEach(select => {
        select.innerHTML = categorias
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join("");
    });

    elements.filterCategoria.innerHTML = `
        <option value="todas">Todas as categorias</option>
        ${categorias.map(cat => `<option value="${cat}">${cat}</option>`).join("")}
    `;
}

function preencherMesesFiltro() {
    const valorSelecionado = elements.filterMes.value || "todos";
    const meses = [...new Set(data.map(item => extrairMes(item.dataISO)).filter(Boolean))];

    elements.filterMes.innerHTML = `
        <option value="todos">Todos os meses</option>
        ${meses.map(mes => `<option value="${mes}">${mes}</option>`).join("")}
    `;

    elements.filterMes.value = meses.includes(valorSelecionado) || valorSelecionado === "todos"
        ? valorSelecionado
        : "todos";
}

function setDefaultDate() {
    if (!elements.dataLancamento.value) {
        elements.dataLancamento.value = new Date().toISOString().split("T")[0];
    }
}

function resetForm() {
    elements.form.reset();
    elements.editId.value = "";
    elements.submitBtn.textContent = "Adicionar lançamento";
    elements.cancelEditBtn.classList.add("hidden");
    setDefaultDate();
}

function salvarMetaHandler() {
    const valor = parseFloat(elements.metaInput.value);
    const titulo = elements.metaTitulo.value.trim() || "Meta principal";

    if (isNaN(valor) || valor <= 0) {
        alert("Digite uma meta válida.");
        return;
    }

    meta = { titulo, valor };
    salvarMeta();
    update();
}

function salvarBudgetHandler() {
    const categoria = elements.budgetCategoria.value;
    const valor = parseFloat(elements.budgetValor.value);

    if (!categoria) {
        alert("Selecione uma categoria.");
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor de limite válido.");
        return;
    }

    budgets[categoria] = valor;
    salvarBudgets();
    elements.budgetValor.value = "";
    update();
}

function handleSubmit(event) {
    event.preventDefault();

    const descricao = elements.desc.value.trim();
    const valor = parseFloat(elements.valor.value);
    const tipo = elements.tipo.value;
    const categoria = elements.cat.value;
    const pagamento = elements.pagamento.value;
    const dataISO = elements.dataLancamento.value;
    const observacao = elements.obs.value.trim();
    const editId = elements.editId.value;

    if (!descricao) {
        alert("Digite uma descrição.");
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        alert("Digite um valor válido.");
        return;
    }

    if (!dataISO) {
        alert("Selecione a data do lançamento.");
        return;
    }

    const payload = {
        id: editId ? Number(editId) : Date.now(),
        descricao,
        valor,
        tipo,
        categoria,
        pagamento,
        observacao,
        dataISO,
        dataFormatada: formatarData(dataISO)
    };

    if (editId) {
        data = data.map(item => item.id === Number(editId) ? payload : item);
    } else {
        data.unshift(payload);
    }

    salvarDados();
    resetForm();
    update();
}

function editarItem(id) {
    const item = data.find(entry => entry.id === id);

    if (!item) return;

    elements.editId.value = item.id;
    elements.desc.value = item.descricao;
    elements.valor.value = item.valor;
    elements.tipo.value = item.tipo;
    elements.cat.value = item.categoria;
    elements.pagamento.value = item.pagamento || "Pix";
    elements.dataLancamento.value = item.dataISO;
    elements.obs.value = item.observacao || "";
    elements.submitBtn.textContent = "Salvar alterações";
    elements.cancelEditBtn.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function removerItem(id) {
    const confirmar = window.confirm("Deseja remover este lançamento?");
    if (!confirmar) return;

    data = data.filter(item => item.id !== id);
    salvarDados();
    update();
}

function exportarJSON() {
    const conteudo = {
        transacoes: data,
        meta,
        orcamentos: budgets,
        exportadoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(conteudo, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financasx-backup.json";
    link.click();
    URL.revokeObjectURL(url);
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        try {
            const parsed = JSON.parse(e.target.result);

            if (!Array.isArray(parsed.transacoes)) {
                throw new Error("Formato inválido.");
            }

            data = parsed.transacoes.map(item => ({
                ...item,
                dataISO: item.dataISO || new Date().toISOString().split("T")[0],
                dataFormatada: item.dataFormatada || formatarData(item.dataISO || new Date().toISOString().split("T")[0]),
                pagamento: item.pagamento || "Pix",
                observacao: item.observacao || ""
            }));

            if (parsed.meta && parsed.meta.valor) {
                meta = parsed.meta;
                salvarMeta();
            }

            if (parsed.orcamentos && typeof parsed.orcamentos === "object") {
                budgets = parsed.orcamentos;
                salvarBudgets();
            }

            salvarDados();
            resetForm();
            update();
            alert("Backup importado com sucesso.");
        } catch (error) {
            alert("Não foi possível importar este arquivo.");
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}

function obterTransacoesFiltradas() {
    const termo = elements.searchInput.value.trim().toLowerCase();
    const tipo = elements.filterTipo.value;
    const categoria = elements.filterCategoria.value;
    const mes = elements.filterMes.value;

    return [...data]
        .filter(item => tipo === "todos" ? true : item.tipo === tipo)
        .filter(item => categoria === "todas" ? true : item.categoria === categoria)
        .filter(item => mes === "todos" ? true : extrairMes(item.dataISO) === mes)
        .filter(item => {
            if (!termo) return true;

            const alvo = [
                item.descricao,
                item.categoria,
                item.pagamento,
                item.observacao
            ].join(" ").toLowerCase();

            return alvo.includes(termo);
        })
        .sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
}

function atualizarResumo(transacoes) {
    const entradas = transacoes
        .filter(item => item.tipo === "entrada")
        .reduce((acc, item) => acc + item.valor, 0);

    const saidas = transacoes
        .filter(item => item.tipo === "saida")
        .reduce((acc, item) => acc + item.valor, 0);

    const saldo = entradas - saidas;

    elements.saldo.textContent = format(saldo);
    elements.entradas.textContent = format(entradas);
    elements.saidas.textContent = format(saidas);
    elements.taxaPoupanca.textContent = `${entradas > 0 ? Math.max(0, ((saldo / entradas) * 100)).toFixed(1) : 0}%`;

    if (saldo > 0) {
        elements.saldoStatus.textContent = "Seu saldo está positivo.";
    } else if (saldo < 0) {
        elements.saldoStatus.textContent = "Seu saldo exige atenção.";
    } else {
        elements.saldoStatus.textContent = "Sem sobra financeira no momento.";
    }

    const mesAtual = new Date().toISOString().slice(0, 7);
    const lancamentosMes = data.filter(item => item.dataISO?.startsWith(mesAtual));

    const entradasMes = lancamentosMes
        .filter(item => item.tipo === "entrada")
        .reduce((acc, item) => acc + item.valor, 0);

    const saidasMes = lancamentosMes
        .filter(item => item.tipo === "saida")
        .reduce((acc, item) => acc + item.valor, 0);

    const economiaMes = entradasMes - saidasMes;
    elements.economiaMes.textContent = format(economiaMes);
    elements.economiaStatus.textContent = economiaMes >= 0
        ? "Você está acumulando no mês atual."
        : "O mês atual está no vermelho.";

    const maiorDespesa = data
        .filter(item => item.tipo === "saida")
        .sort((a, b) => b.valor - a.valor)[0];

    elements.maiorGasto.textContent = maiorDespesa ? format(maiorDespesa.valor) : format(0);
    elements.maiorGastoDesc.textContent = maiorDespesa
        ? `${maiorDespesa.descricao} • ${maiorDespesa.categoria}`
        : "Sem despesas registradas.";

    return { entradas, saidas, saldo };
}

function atualizarAlerta(saldo) {
    elements.alert.className = "";
    elements.alert.innerHTML = "";

    if (saldo < 0) {
        elements.alert.classList.add("alert", "redA");
        elements.alert.textContent = "⚠️ Seu saldo está negativo. Reveja seus gastos e prioridades.";
    } else if (saldo < meta.valor * 0.2) {
        elements.alert.classList.add("alert", "yellowA");
        elements.alert.textContent = "⚠️ Seu saldo ainda está distante da meta. Tente aumentar entradas ou reduzir saídas.";
    } else {
        elements.alert.classList.add("alert", "greenA");
        elements.alert.textContent = "✅ Sua organização financeira está atualizada. Continue acompanhando sua evolução.";
    }
}

function atualizarMeta(saldo) {
    const valorMeta = Number(meta.valor || 0);
    const progresso = valorMeta > 0 ? Math.max(0, Math.min(saldo, valorMeta)) : 0;
    const percentual = valorMeta > 0 ? (progresso / valorMeta) * 100 : 0;

    elements.metaInput.value = valorMeta || "";
    elements.metaTitulo.value = meta.titulo || "";
    elements.metaNomeExibida.textContent = meta.titulo || "Meta principal";
    elements.metaValor.textContent = `${format(progresso)} / ${format(valorMeta)}`;
    elements.metaPercent.textContent = `${percentual.toFixed(1)}%`;
    elements.metaBar.value = percentual;
    elements.metaHint.textContent = percentual >= 100
        ? "Meta atingida. Hora de definir o próximo objetivo."
        : `Faltam ${format(Math.max(valorMeta - progresso, 0))} para atingir sua meta.`;
}

function atualizarBudgets() {
    const gastosPorCategoria = {};

    data
        .filter(item => item.tipo === "saida")
        .forEach(item => {
            gastosPorCategoria[item.categoria] = (gastosPorCategoria[item.categoria] || 0) + item.valor;
        });

    const categoriasOrcadas = Object.keys(budgets);

    if (!categoriasOrcadas.length) {
        elements.budgetList.innerHTML = `
            <div class="empty-state">
                Defina limites mensais por categoria para acompanhar seu orçamento.
            </div>
        `;
        return;
    }

    elements.budgetList.innerHTML = categoriasOrcadas.map(categoria => {
        const limite = budgets[categoria];
        const gasto = gastosPorCategoria[categoria] || 0;
        const percentual = limite > 0 ? Math.min((gasto / limite) * 100, 100) : 0;
        const restante = Math.max(limite - gasto, 0);
        const excedeu = gasto > limite;

        return `
            <div class="budget-item">
                <div class="budget-head">
                    <strong>${categoria}</strong>
                    <span>${percentual.toFixed(1)}%</span>
                </div>
                <progress value="${percentual}" max="100"></progress>
                <div class="budget-meta">
                    <span>Gasto: ${format(gasto)}</span>
                    <span>${excedeu ? `Acima em ${format(gasto - limite)}` : `Restante: ${format(restante)}`}</span>
                </div>
            </div>
        `;
    }).join("");
}

function renderTransactions(transacoes) {
    elements.transactionCounter.textContent = `${transacoes.length} ${transacoes.length === 1 ? "item" : "itens"}`;

    if (!transacoes.length) {
        elements.list.innerHTML = `
            <div class="empty-state">
                Nenhum lançamento encontrado com os filtros atuais.
            </div>
        `;
        return;
    }

    elements.list.innerHTML = transacoes.map(item => `
        <div class="item">
            <div class="item-info">
                <div class="item-title-row">
                    <strong>${item.descricao}</strong>
                    <span class="badge ${item.tipo}">${item.tipo === "entrada" ? "Entrada" : "Saída"}</span>
                </div>
                <div class="small">
                    ${item.categoria} • ${item.dataFormatada || formatarData(item.dataISO)} • ${item.pagamento || "Sem forma de pagamento"}
                    ${item.observacao ? `<br>${item.observacao}` : ""}
                </div>
            </div>

            <div class="item-value">
                <span class="${item.tipo === "entrada" ? "green" : "red"}">${item.tipo === "entrada" ? "+" : "-"} ${format(item.valor)}</span>
                <button class="icon-btn edit-btn" onclick="editarItem(${item.id})" title="Editar lançamento">✏️</button>
                <button class="icon-btn delete-btn" onclick="removerItem(${item.id})" title="Remover lançamento">🗑️</button>
            </div>
        </div>
    `).join("");
}

function destruirGrafico(instancia) {
    if (instancia) {
        instancia.destroy();
    }
}

function criarChart(contextId, config) {
    const canvas = document.getElementById(contextId);
    return new Chart(canvas, config);
}

function atualizarGraficos() {
    const totalEntradas = data
        .filter(item => item.tipo === "entrada")
        .reduce((acc, item) => acc + item.valor, 0);

    const totalSaidas = data
        .filter(item => item.tipo === "saida")
        .reduce((acc, item) => acc + item.valor, 0);

    destruirGrafico(overviewChart);
    overviewChart = criarChart("overviewChart", {
        type: "doughnut",
        data: {
            labels: ["Entradas", "Saídas"],
            datasets: [{
                data: [totalEntradas, totalSaidas],
                backgroundColor: ["#22c55e", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: getChartOptions()
    });

    const saidasPorCategoria = {};
    data
        .filter(item => item.tipo === "saida")
        .forEach(item => {
            saidasPorCategoria[item.categoria] = (saidasPorCategoria[item.categoria] || 0) + item.valor;
        });

    destruirGrafico(categoryChart);
    categoryChart = criarChart("categoryChart", {
        type: "bar",
        data: {
            labels: Object.keys(saidasPorCategoria),
            datasets: [{
                label: "Gastos",
                data: Object.values(saidasPorCategoria),
                backgroundColor: Object.keys(saidasPorCategoria).map((_, index) => coresCategorias[index % coresCategorias.length]),
                borderRadius: 10
            }]
        },
        options: {
            ...getChartOptions(),
            scales: {
                x: { ticks: { color: "#d6e2f7" }, grid: { display: false } },
                y: { ticks: { color: "#d6e2f7" }, grid: { color: "rgba(148,163,184,.12)" } }
            }
        }
    });

    const resumoMensal = {};
    data.forEach(item => {
        const chave = item.dataISO?.slice(0, 7) || "Sem data";
        if (!resumoMensal[chave]) {
            resumoMensal[chave] = { entradas: 0, saidas: 0 };
        }

        resumoMensal[chave][item.tipo === "entrada" ? "entradas" : "saidas"] += item.valor;
    });

    const labelsBase = Object.keys(resumoMensal).sort();
    const labels = labelsBase.map(label => {
        if (label === "Sem data") return label;
        return getMonthNameKey(`${label}-01`);
    });
    const saldos = labelsBase.map(label => resumoMensal[label].entradas - resumoMensal[label].saidas);

    destruirGrafico(monthlyChart);
    monthlyChart = criarChart("monthlyChart", {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Saldo mensal",
                data: saldos,
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.18)",
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            ...getChartOptions(),
            scales: {
                x: { ticks: { color: "#d6e2f7" }, grid: { display: false } },
                y: { ticks: { color: "#d6e2f7" }, grid: { color: "rgba(148,163,184,.12)" } }
            }
        }
    });
}

function getChartOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: "#d6e2f7"
                }
            }
        }
    };
}

function limparFiltros() {
    elements.searchInput.value = "";
    elements.filterTipo.value = "todos";
    elements.filterCategoria.value = "todas";
    elements.filterMes.value = "todos";
    update();
}

function normalizarDadosAntigos() {
    data = data.map(item => {
        if (item.dataISO) {
            return {
                ...item,
                dataFormatada: item.dataFormatada || formatarData(item.dataISO),
                pagamento: item.pagamento || "Pix",
                observacao: item.observacao || ""
            };
        }

        const hoje = new Date().toISOString().split("T")[0];
        return {
            ...item,
            pagamento: item.pagamento || "Pix",
            observacao: item.observacao || "",
            dataISO: hoje,
            dataFormatada: formatarData(hoje)
        };
    });
    salvarDados();
}

function animateBackground() {
    const canvas = document.getElementById("bg");
    const ctx = canvas.getContext("2d");

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const points = Array.from({ length: Math.min(70, Math.floor(width / 20)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5
    }));

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        points.forEach(point => {
            point.x += point.speedX;
            point.y += point.speedY;

            if (point.x < 0 || point.x > width) point.speedX *= -1;
            if (point.y < 0 || point.y > height) point.speedY *= -1;

            ctx.beginPath();
            ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
            ctx.fill();
        });

        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const dx = points[i].x - points[j].x;
                const dy = points[i].y - points[j].y;
                const distancia = Math.sqrt(dx * dx + dy * dy);

                if (distancia < 120) {
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(points[j].x, points[j].y);
                    ctx.strokeStyle = `rgba(139, 92, 246, ${0.14 - distancia / 1000})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    draw();
}

function update() {
    preencherMesesFiltro();
    const transacoesFiltradas = obterTransacoesFiltradas();
    const resumo = atualizarResumo(data);
    atualizarMeta(resumo.saldo);
    atualizarAlerta(resumo.saldo);
    atualizarBudgets();
    renderTransactions(transacoesFiltradas);
    atualizarGraficos();
}

function bindEvents() {
    elements.form.addEventListener("submit", handleSubmit);
    elements.cancelEditBtn.addEventListener("click", resetForm);
    elements.saveGoalBtn.addEventListener("click", salvarMetaHandler);
    elements.saveBudgetBtn.addEventListener("click", salvarBudgetHandler);
    elements.exportJsonBtn.addEventListener("click", exportarJSON);
    elements.importFile.addEventListener("change", importarJSON);
    elements.clearFiltersBtn.addEventListener("click", limparFiltros);

    elements.searchInput.addEventListener("input", update);
    [
        elements.filterTipo,
        elements.filterCategoria,
        elements.filterMes
    ].forEach(input => input.addEventListener("change", update));
}

function init() {
    preencherCategorias();
    normalizarDadosAntigos();
    setDefaultDate();
    resetForm();
    bindEvents();
    animateBackground();
    update();
}

window.editarItem = editarItem;
window.removerItem = removerItem;

init();
