let data = JSON.parse(localStorage.getItem("financasx")) || [];
let chart = null;

/* =========================
   META (EDITÁVEL + SALVA)
========================= */
let META_FINANCEIRA =
    parseFloat(localStorage.getItem("meta")) || 5000;

/* =========================
   FORMATAR MOEDA
========================= */
function format(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/* =========================
   SALVAR DADOS
========================= */
function save() {
    localStorage.setItem("financasx", JSON.stringify(data));
}

/* =========================
   SALVAR META
========================= */
function salvarMeta() {

    const novaMeta = parseFloat(
        document.getElementById("metaInput").value
    );

    if (isNaN(novaMeta) || novaMeta <= 0) {
        alert("Digite uma meta válida!");
        return;
    }

    META_FINANCEIRA = novaMeta;

    localStorage.setItem("meta", novaMeta);

    update();
}

/* =========================
   ADICIONAR
========================= */
function add() {

    const descricao = document.getElementById("desc").value.trim();
    const valor = parseFloat(document.getElementById("valor").value);
    const tipo = document.getElementById("tipo").value;
    const categoria = document.getElementById("cat").value;

    if (!descricao) return alert("Digite uma descrição.");
    if (isNaN(valor) || valor <= 0) return alert("Digite um valor válido.");

    data.push({
        id: Date.now(),
        descricao,
        valor,
        tipo,
        categoria,
        data: new Date().toLocaleDateString("pt-BR")
    });

    document.getElementById("desc").value = "";
    document.getElementById("valor").value = "";

    update();
}

/* =========================
   REMOVER
========================= */
function removeItem(id) {
    data = data.filter(item => item.id !== id);
    update();
}

/* =========================
   ALERTA
========================= */
function atualizarAlerta(saldo) {

    const alertBox = document.getElementById("alert");
    alertBox.className = "";

    if (saldo < 0) {
        alertBox.classList.add("alert", "redA");
        alertBox.innerHTML = "⚠️ Seu saldo está negativo.";
    } 
    else if (saldo < 100) {
        alertBox.classList.add("alert", "yellowA");
        alertBox.innerHTML = "⚠️ Atenção ao seu orçamento.";
    } 
    else {
        alertBox.innerHTML = "";
    }
}

/* =========================
   META
========================= */
function atualizarMeta(saldo) {

    const progresso = Math.max(
        0,
        Math.min(saldo, META_FINANCEIRA)
    );

    const porcentagem = (progresso / META_FINANCEIRA) * 100;

    document.getElementById("metaValor").innerText =
        `${format(progresso)} / ${format(META_FINANCEIRA)}`;

    const bar = document.getElementById("metaBar");

    if (bar) {
        bar.value = porcentagem;
    }
}

/* =========================
   GRÁFICO
========================= */
function atualizarGrafico(entradas, saidas) {

    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Entradas", "Saídas"],
            datasets: [{
                data: [entradas, saidas],
                backgroundColor: ["#22c55e", "#ef4444"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: "#ffffff" }
                }
            }
        }
    });
}

/* =========================
   UPDATE GERAL
========================= */
function update() {

    let entradas = 0;
    let saidas = 0;

    const list = document.getElementById("list");
    list.innerHTML = "";

    data.forEach(item => {

        if (item.tipo === "entrada") {
            entradas += item.valor;
        } else {
            saidas += item.valor;
        }

        const div = document.createElement("div");
        div.className = "item";

        div.innerHTML = `
            <div class="item-info">
                <strong>${item.descricao}</strong>
                <div class="small">
                    ${item.categoria} • ${item.data}
                </div>
            </div>

            <div class="item-value">
                <span>${format(item.valor)}</span>
                <button class="delete-btn"
                    onclick="removeItem(${item.id})">
                    🗑️
                </button>
            </div>
        `;

        list.appendChild(div);
    });

    const saldo = entradas - saidas;

    document.getElementById("saldo").innerText = format(saldo);
    document.getElementById("entradas").innerText = format(entradas);
    document.getElementById("saidas").innerText = format(saidas);

    atualizarMeta(saldo);
    atualizarAlerta(saldo);
    atualizarGrafico(entradas, saidas);

    save();
}

/* =========================
   START
========================= */
update();