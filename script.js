// 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ЕДИНАЯ БАЗА ДАННЫХ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
let systemData = {
    citizens: [],
    drivers: [],
    migration: [],
    pdn: [],
    cusp: [],
    adminProtocols: [],
    criminalCases: [],
    wanted: [],
    stateSecret: {
        terrorists: [],
        terroristOrgs: [],
        extremists: [],
        unwanted: [],
        foreignAgents: [],
        sorm: []
    },
    debtors: [],
    journal: [],
    news: [],
    operational: []
};

let currentUser = null;
let currentModule = 'dashboard';
let editingId = null;

// 🔧 ФИКС: УНИКАЛЬНЫЙ ID ДЛЯ БАЗЫ ДАННЫХ
const CURRENT_DATABASE_ID = 'mvd_unified_database_v4';

// 🔧 ФУНКЦИЯ ГЕНЕРАЦИИ ОТПЕЧАТКА ПАЛЬЦА
function generateFingerprint(birthDate, nickname) {
    if (!birthDate) return `FP_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const dateStr = birthDate.replace(/-/g, '');
    const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `FP_${dateStr}_${randomPart}`;
}

// === СИСТЕМНЫЕ ФУНКЦИИ ===
async function loadAllData() {
    console.log('🔄 Загрузка данных...');
    try {
        const currentSnapshot = await database.ref(CURRENT_DATABASE_ID).once('value');
        const currentData = currentSnapshot.val();
        if (currentData) {
            console.log('✅ Данные загружены из Firebase');
            systemData = {...systemData, ...currentData};
            showNotification('✅ Данные загружены из облака', 'success');
            return;
        }
        console.log('🔄 Данных в Firebase нет, создаем начальные данные');
        await createInitialData();
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        await createInitialData();
    }
}

async function createInitialData() {
    console.log('🔄 Создаем начальные данные...');
    
    // Тестовые граждане
    const testCitizens = [
        {
            id: Date.now(),
            nickname: "Ivanov_Test",
            fullName: "Иванов Иван Иванович",
            birthDate: "1990-05-15",
            passportNumber: "4510 123456",
            address: "г. Москва, ул. Ленина, д. 1",
            additionalInfo: "Тестовый гражданин",
            criminalRecord: false,
            fingerprint: generateFingerprint("1990-05-15", "Ivanov_Test"),
            createdBy: "system",
            createdAt: new Date().toLocaleString()
        },
        {
            id: Date.now() + 1,
            nickname: "Petrov_Test",
            fullName: "Петров Петр Петрович",
            birthDate: "1985-08-20",
            passportNumber: "4510 789012",
            address: "г. Москва, ул. Пушкина, д. 10",
            additionalInfo: "Тестовый гражданин 2",
            criminalRecord: true,
            fingerprint: generateFingerprint("1985-08-20", "Petrov_Test"),
            createdBy: "system",
            createdAt: new Date().toLocaleString()
        }
    ];
    
    // Тестовые водители
    const testDrivers = [
        {
            id: Date.now() + 2,
            nickname: "Driver_Test",
            fullName: "Сидоров Алексей Владимирович",
            licenseNumber: "1234 567890",
            categories: "B,C",
            birthDate: "1988-03-10",
            address: "г. Москва, ул. Гагарина, д. 15",
            fines: "12.09.2023 - 5000 руб. - Превышение скорости",
            additionalInfo: "Тестовый водитель",
            createdBy: "system",
            createdAt: new Date().toLocaleString()
        }
    ];
    
    // Тестовые КУСП
    const testCUSP = [
        {
            id: Date.now() + 3,
            applicant: "Кузнецов Михаил",
            contacts: "+7 999 123-45-67",
            statement: "Кража велосипеда из подъезда",
            responsible: "Система",
            dateTime: new Date().toISOString().slice(0, 16),
            status: "Зарегистрировано",
            createdBy: "system",
            createdAt: new Date().toLocaleString()
        }
    ];
    
    systemData.citizens.push(...testCitizens);
    systemData.drivers.push(...testDrivers);
    systemData.cusp.push(...testCUSP);
    
    await saveAllData();
    console.log('✅ Начальные данные созданы');
}

async function saveAllData() {
    console.log('💾 Сохранение данных...');
    try {
        await database.ref(CURRENT_DATABASE_ID).set(systemData);
        console.log('✅ Данные сохранены в Firebase');
        
        // Локальная резервная копия
        const backupData = JSON.stringify(systemData);
        localStorage.setItem(CURRENT_DATABASE_ID + '_backup', backupData);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('❌ Ошибка сохранения данных', 'error');
        return false;
    }
}

function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (confirm(`Импортировать данные из файла?\n\nГраждане: ${importedData.citizens?.length || 0}\nВодители: ${importedData.drivers?.length || 0}\nКУСП: ${importedData.cusp?.length || 0}\n\nСуществующие данные будут объединены с импортированными.`)) {
                
                // Объединяем данные
                for (const key in importedData) {
                    if (Array.isArray(importedData[key])) {
                        systemData[key] = [...systemData[key], ...importedData[key]];
                    } else if (typeof importedData[key] === 'object') {
                        systemData[key] = {...systemData[key], ...importedData[key]};
                    }
                }
                
                if (await saveAllData()) {
                    showNotification('✅ Данные успешно импортированы и сохранены в облако', 'success');
                    showModule(currentModule);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка импорта:', error);
            showNotification('❌ Ошибка импорта данных. Проверьте формат файла.', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportToFile() {
    const dataStr = JSON.stringify(systemData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `mvd_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showNotification('✅ Данные экспортированы в файл', 'success');
}

// === ФУНКЦИЯ УВЕДОМЛЕНИЙ ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px; border-radius: 10px;
        color: white; z-index: 10000; font-weight: bold; max-width: 400px; transition: all 0.3s;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.2);
    `;
    const colors = {
        success: 'linear-gradient(135deg, #00b09b, #96c93d)',
        error: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
        warning: 'linear-gradient(135deg, #f39c12, #e67e22)',
        info: 'linear-gradient(135deg, #4facfe, #00f2fe)'
    };
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// === ОСНОВНЫЕ МОДУЛИ ===
function showModule(moduleName) {
    currentModule = moduleName;
    editingId = null;
    const moduleContent = document.getElementById('moduleContent');
    
    const modules = {
        'citizens': { html: getCitizensModule, load: loadCitizensTable },
        'drivers': { html: getDriversModule, load: loadDriversTable },
        'migration': { html: getMigrationModule, load: loadMigrationTable },
        'pdn': { html: getPDNModule, load: loadPDNTable },
        'operational': { html: getOperationalModule, load: loadOperationalTable },
        'cusp': { html: getCUSPModule, load: loadCUSPTable },
        'admin_protocols': { html: getAdminProtocolsModule, load: loadAdminProtocolsTable },
        'criminal_cases': { html: getCriminalCasesModule, load: loadCriminalCasesTable },
        'wanted': { html: getWantedModule, load: loadWantedTable },
        'state_secret': { html: getStateSecretModule, load: loadStateSecretData },
        'debtors': { html: getDebtorsModule, load: loadDebtorsTable },
        'journal': { html: getJournalModule, load: loadJournalEntries },
        'news': { html: getNewsModule, load: loadNews },
        'games': { html: getGamesModule, load: () => {} }
    };
    
    const module = modules[moduleName] || { html: getDashboardModule, load: () => {} };
    moduleContent.innerHTML = module.html();
    module.load();
}

// === МОДУЛЬ БАЗЫ ГРАЖДАН ===
function getCitizensModule() {
    return `
        <div class="module">
            <div class="module-header">
                <h2>👥 База данных граждан</h2>
                <div class="header-stats">
                    <span class="stat">Всего: ${systemData.citizens.length}</span>
                    <span class="stat">С судимостью: ${systemData.citizens.filter(c => c.criminalRecord).length}</span>
                </div>
            </div>
            
            <div class="module-controls">
                <div class="search-box">
                    <input type="text" id="searchCitizens" placeholder="🔍 Поиск по ФИО или никнейму..." onkeyup="searchCitizens()">
                </div>
                <button class="btn btn-success" onclick="showCitizenForm()">
                    <span class="btn-icon">➕</span> Добавить гражданина
                </button>
            </div>

            <div id="citizenFormContainer" class="form-container" style="display: none;">
                <div class="form-header">
                    <h3>${editingId ? '✏️ Редактирование гражданина' : '👤 Добавление гражданина'}</h3>
                    <button class="btn-close" onclick="hideCitizenForm()">×</button>
                </div>
                <form onsubmit="saveCitizen(event)" class="form-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="citizenNickname">Никнейм *</label>
                            <input type="text" id="citizenNickname" required>
                        </div>
                        <div class="form-group">
                            <label for="citizenFullName">ФИО *</label>
                            <input type="text" id="citizenFullName" required>
                        </div>
                        <div class="form-group">
                            <label for="citizenBirthDate">Дата рождения</label>
                            <input type="date" id="citizenBirthDate">
                        </div>
                        <div class="form-group">
                            <label for="citizenPassport">Номер паспорта</label>
                            <input type="text" id="citizenPassport" placeholder="4510 123456">
                        </div>
                        <div class="form-group full-width">
                            <label for="citizenAddress">Место регистрации</label>
                            <input type="text" id="citizenAddress" placeholder="г. Москва, ул. Ленина, д. 1">
                        </div>
                        <div class="form-group full-width">
                            <label for="citizenAdditionalInfo">Дополнительная информация</label>
                            <textarea id="citizenAdditionalInfo" rows="3" placeholder="Особые приметы, род занятий и т.д."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="citizenCriminalRecord">
                                <span class="checkmark"></span>
                                Имеет судимость
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="citizenFingerprint">Отпечаток пальца</label>
                            <div class="fingerprint-input">
                                <input type="text" id="citizenFingerprint" readonly>
                                <button type="button" class="btn btn-secondary" onclick="generateNewFingerprint()">
                                    🔄 Сгенерировать
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideCitizenForm()">Отмена</button>
                        <button type="submit" class="btn btn-primary">
                            ${editingId ? '💾 Обновить' : '✅ Сохранить'}
                        </button>
                    </div>
                </form>
            </div>

            <div class="data-section">
                <div id="citizensTableContainer" class="table-container"></div>
            </div>
        </div>
    `;
}

function showCitizenForm() {
    editingId = null;
    const container = document.getElementById('citizenFormContainer');
    container.style.display = 'block';
    
    // Очистка формы
    const form = container.querySelector('form');
    form.reset();
    document.getElementById('citizenFingerprint').value = generateFingerprint('', '');
}

function hideCitizenForm() {
    document.getElementById('citizenFormContainer').style.display = 'none';
    editingId = null;
}

function generateNewFingerprint() {
    const birthDate = document.getElementById('citizenBirthDate').value;
    const nickname = document.getElementById('citizenNickname').value;
    document.getElementById('citizenFingerprint').value = generateFingerprint(birthDate, nickname);
}

function saveCitizen(event) {
    event.preventDefault();
    
    const citizen = {
        id: editingId || Date.now(),
        nickname: document.getElementById('citizenNickname').value,
        fullName: document.getElementById('citizenFullName').value,
        birthDate: document.getElementById('citizenBirthDate').value,
        passportNumber: document.getElementById('citizenPassport').value,
        address: document.getElementById('citizenAddress').value,
        additionalInfo: document.getElementById('citizenAdditionalInfo').value,
        criminalRecord: document.getElementById('citizenCriminalRecord').checked,
        fingerprint: document.getElementById('citizenFingerprint').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.citizens.findIndex(c => c.id === editingId);
        if (index !== -1) {
            systemData.citizens[index] = citizen;
            showNotification('✅ Гражданин обновлен', 'success');
        }
    } else {
        systemData.citizens.push(citizen);
        showNotification('✅ Гражданин добавлен', 'success');
    }
    
    saveAllData();
    loadCitizensTable();
    hideCitizenForm();
}

function editCitizen(id) {
    const citizen = systemData.citizens.find(c => c.id === id);
    if (citizen) {
        editingId = id;
        const container = document.getElementById('citizenFormContainer');
        container.style.display = 'block';
        
        document.getElementById('citizenNickname').value = citizen.nickname;
        document.getElementById('citizenFullName').value = citizen.fullName;
        document.getElementById('citizenBirthDate').value = citizen.birthDate;
        document.getElementById('citizenPassport').value = citizen.passportNumber;
        document.getElementById('citizenAddress').value = citizen.address;
        document.getElementById('citizenAdditionalInfo').value = citizen.additionalInfo;
        document.getElementById('citizenCriminalRecord').checked = citizen.criminalRecord;
        document.getElementById('citizenFingerprint').value = citizen.fingerprint;
    }
}

function loadCitizensTable() {
    const container = document.getElementById('citizensTableContainer');
    if (!container) return;
    
    if (systemData.citizens.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Нет данных о гражданах</h3>
                <p>Добавьте первого гражданина в базу данных</p>
                <button class="btn btn-success" onclick="showCitizenForm()">➕ Добавить гражданина</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Никнейм</th>
                        <th>ФИО</th>
                        <th>Дата рождения</th>
                        <th>Паспорт</th>
                        <th>Адрес</th>
                        <th>Судимость</th>
                        <th>Отпечаток</th>
                        <th>Добавил</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${systemData.citizens.map(citizen => `
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <span class="user-avatar">👤</span>
                                    <span class="user-name">${citizen.nickname}</span>
                                </div>
                            </td>
                            <td><strong>${citizen.fullName}</strong></td>
                            <td>${citizen.birthDate || '<span class="text-muted">—</span>'}</td>
                            <td>${citizen.passportNumber || '<span class="text-muted">—</span>'}</td>
                            <td>${citizen.address || '<span class="text-muted">—</span>'}</td>
                            <td>
                                <span class="status-badge ${citizen.criminalRecord ? 'status-danger' : 'status-success'}">
                                    ${citizen.criminalRecord ? '✅' : '❌'}
                                </span>
                            </td>
                            <td>
                                <code class="fingerprint-code">${citizen.fingerprint}</code>
                            </td>
                            <td>
                                <div class="created-info">
                                    <span class="created-by">${citizen.createdBy}</span>
                                    <span class="created-date">${formatDate(citizen.createdAt)}</span>
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editCitizen(${citizen.id})" title="Редактировать">
                                        ✏️
                                    </button>
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteCitizen(${citizen.id})" title="Удалить">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Показано ${systemData.citizens.length} записей
            </div>
        </div>
    `;
}

function searchCitizens() {
    const searchTerm = document.getElementById('searchCitizens').value.toLowerCase();
    const container = document.getElementById('citizensTableContainer');
    
    if (!searchTerm) {
        loadCitizensTable();
        return;
    }
    
    const filteredCitizens = systemData.citizens.filter(citizen => 
        citizen.nickname.toLowerCase().includes(searchTerm) || 
        citizen.fullName.toLowerCase().includes(searchTerm) ||
        (citizen.passportNumber && citizen.passportNumber.toLowerCase().includes(searchTerm))
    );
    
    if (filteredCitizens.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Никнейм</th>
                        <th>ФИО</th>
                        <th>Дата рождения</th>
                        <th>Паспорт</th>
                        <th>Адрес</th>
                        <th>Судимость</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredCitizens.map(citizen => `
                        <tr>
                            <td>${citizen.nickname}</td>
                            <td><strong>${citizen.fullName}</strong></td>
                            <td>${citizen.birthDate || '<span class="text-muted">—</span>'}</td>
                            <td>${citizen.passportNumber || '<span class="text-muted">—</span>'}</td>
                            <td>${citizen.address || '<span class="text-muted">—</span>'}</td>
                            <td>
                                <span class="status-badge ${citizen.criminalRecord ? 'status-danger' : 'status-success'}">
                                    ${citizen.criminalRecord ? '✅' : '❌'}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editCitizen(${citizen.id})">✏️</button>
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteCitizen(${citizen.id})">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Найдено ${filteredCitizens.length} из ${systemData.citizens.length} записей
            </div>
        </div>
    `;
}

function deleteCitizen(id) {
    if (confirm('Вы уверены, что хотите удалить гражданина из базы данных?')) {
        systemData.citizens = systemData.citizens.filter(c => c.id !== id);
        saveAllData();
        loadCitizensTable();
        showNotification('✅ Гражданин удален', 'success');
    }
}

// === МОДУЛЬ БАЗЫ ВОДИТЕЛЕЙ ===
function getDriversModule() {
    return `
        <div class="module">
            <div class="module-header">
                <h2>🚗 База данных водителей</h2>
                <div class="header-stats">
                    <span class="stat">Всего: ${systemData.drivers.length}</span>
                    <span class="stat">Со штрафами: ${systemData.drivers.filter(d => d.fines).length}</span>
                </div>
            </div>
            
            <div class="module-controls">
                <div class="search-box">
                    <input type="text" id="searchDrivers" placeholder="🔍 Поиск по ФИО, никнейму или номеру В/У..." onkeyup="searchDrivers()">
                </div>
                <button class="btn btn-success" onclick="showDriverForm()">
                    <span class="btn-icon">➕</span> Добавить водителя
                </button>
            </div>

            <div id="driverFormContainer" class="form-container" style="display: none;">
                <div class="form-header">
                    <h3>${editingId ? '✏️ Редактирование водителя' : '🚗 Добавление водителя'}</h3>
                    <button class="btn-close" onclick="hideDriverForm()">×</button>
                </div>
                <form onsubmit="saveDriver(event)" class="form-content">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="driverNickname">Никнейм водителя *</label>
                            <input type="text" id="driverNickname" required>
                        </div>
                        <div class="form-group">
                            <label for="driverFullName">ФИО водителя *</label>
                            <input type="text" id="driverFullName" required>
                        </div>
                        <div class="form-group">
                            <label for="driverLicenseNumber">Номер В/У *</label>
                            <input type="text" id="driverLicenseNumber" required placeholder="1234 567890">
                        </div>
                        <div class="form-group">
                            <label for="driverCategories">Категории *</label>
                            <input type="text" id="driverCategories" required placeholder="A,B,C,D">
                        </div>
                        <div class="form-group">
                            <label for="driverBirthDate">Дата рождения</label>
                            <input type="date" id="driverBirthDate">
                        </div>
                        <div class="form-group">
                            <label for="driverAddress">Адрес</label>
                            <input type="text" id="driverAddress">
                        </div>
                        <div class="form-group full-width">
                            <label for="driverFines">Административные штрафы</label>
                            <textarea id="driverFines" rows="3" placeholder="Дата, сумма, нарушение..."></textarea>
                        </div>
                        <div class="form-group full-width">
                            <label for="driverAdditionalInfo">Дополнительная информация</label>
                            <textarea id="driverAdditionalInfo" rows="2"></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideDriverForm()">Отмена</button>
                        <button type="submit" class="btn btn-primary">
                            ${editingId ? '💾 Обновить' : '✅ Сохранить'}
                        </button>
                    </div>
                </form>
            </div>

            <div class="data-section">
                <div id="driversTableContainer" class="table-container"></div>
            </div>
        </div>
    `;
}

function showDriverForm() {
    editingId = null;
    const container = document.getElementById('driverFormContainer');
    container.style.display = 'block';
    container.querySelector('form').reset();
}

function hideDriverForm() {
    document.getElementById('driverFormContainer').style.display = 'none';
    editingId = null;
}

function saveDriver(event) {
    event.preventDefault();
    
    const driver = {
        id: editingId || Date.now(),
        nickname: document.getElementById('driverNickname').value,
        fullName: document.getElementById('driverFullName').value,
        licenseNumber: document.getElementById('driverLicenseNumber').value,
        categories: document.getElementById('driverCategories').value,
        birthDate: document.getElementById('driverBirthDate').value,
        address: document.getElementById('driverAddress').value,
        fines: document.getElementById('driverFines').value,
        additionalInfo: document.getElementById('driverAdditionalInfo').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.drivers.findIndex(d => d.id === editingId);
        if (index !== -1) {
            systemData.drivers[index] = driver;
            showNotification('✅ Водитель обновлен', 'success');
        }
    } else {
        systemData.drivers.push(driver);
        showNotification('✅ Водитель добавлен', 'success');
    }
    
    saveAllData();
    loadDriversTable();
    hideDriverForm();
}

function editDriver(id) {
    const driver = systemData.drivers.find(d => d.id === id);
    if (driver) {
        editingId = id;
        const container = document.getElementById('driverFormContainer');
        container.style.display = 'block';
        
        document.getElementById('driverNickname').value = driver.nickname;
        document.getElementById('driverFullName').value = driver.fullName;
        document.getElementById('driverLicenseNumber').value = driver.licenseNumber;
        document.getElementById('driverCategories').value = driver.categories;
        document.getElementById('driverBirthDate').value = driver.birthDate;
        document.getElementById('driverAddress').value = driver.address;
        document.getElementById('driverFines').value = driver.fines;
        document.getElementById('driverAdditionalInfo').value = driver.additionalInfo;
    }
}

function loadDriversTable() {
    const container = document.getElementById('driversTableContainer');
    if (!container) return;
    
    if (systemData.drivers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🚗</div>
                <h3>Нет данных о водителях</h3>
                <p>Добавьте первого водителя в базу данных</p>
                <button class="btn btn-success" onclick="showDriverForm()">➕ Добавить водителя</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Никнейм</th>
                        <th>ФИО</th>
                        <th>Номер В/У</th>
                        <th>Категории</th>
                        <th>Дата рождения</th>
                        <th>Штрафы</th>
                        <th>Добавил</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${systemData.drivers.map(driver => `
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <span class="user-avatar">👤</span>
                                    <span class="user-name">${driver.nickname}</span>
                                </div>
                            </td>
                            <td><strong>${driver.fullName}</strong></td>
                            <td>
                                <code class="license-number">${driver.licenseNumber}</code>
                            </td>
                            <td>
                                <div class="categories-list">
                                    ${driver.categories.split(',').map(cat => 
                                        `<span class="category-badge">${cat.trim()}</span>`
                                    ).join('')}
                                </div>
                            </td>
                            <td>${driver.birthDate || '<span class="text-muted">—</span>'}</td>
                            <td>
                                <span class="status-badge ${driver.fines ? 'status-warning' : 'status-success'}">
                                    ${driver.fines ? '⚠️' : '✅'}
                                </span>
                            </td>
                            <td>
                                <div class="created-info">
                                    <span class="created-by">${driver.createdBy}</span>
                                    <span class="created-date">${formatDate(driver.createdAt)}</span>
                                </div>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editDriver(${driver.id})" title="Редактировать">
                                        ✏️
                                    </button>
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteDriver(${driver.id})" title="Удалить">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Показано ${systemData.drivers.length} записей
            </div>
        </div>
    `;
}

function searchDrivers() {
    const searchTerm = document.getElementById('searchDrivers').value.toLowerCase();
    const container = document.getElementById('driversTableContainer');
    
    if (!searchTerm) {
        loadDriversTable();
        return;
    }
    
    const filteredDrivers = systemData.drivers.filter(driver => 
        driver.nickname.toLowerCase().includes(searchTerm) || 
        driver.fullName.toLowerCase().includes(searchTerm) ||
        driver.licenseNumber.toLowerCase().includes(searchTerm)
    );
    
    if (filteredDrivers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Никнейм</th>
                        <th>ФИО</th>
                        <th>Номер В/У</th>
                        <th>Категории</th>
                        <th>Штрафы</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredDrivers.map(driver => `
                        <tr>
                            <td>${driver.nickname}</td>
                            <td><strong>${driver.fullName}</strong></td>
                            <td>${driver.licenseNumber}</td>
                            <td>${driver.categories}</td>
                            <td>${driver.fines ? '⚠️' : '✅'}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editDriver(${driver.id})">✏️</button>
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteDriver(${driver.id})">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Найдено ${filteredDrivers.length} из ${systemData.drivers.length} записей
            </div>
        </div>
    `;
}

function deleteDriver(id) {
    if (confirm('Вы уверены, что хотите удалить водителя из базы данных?')) {
        systemData.drivers = systemData.drivers.filter(d => d.id !== id);
        saveAllData();
        loadDriversTable();
        showNotification('✅ Водитель удален', 'success');
    }
}

// === РАСШИРЕННЫЙ МОДУЛЬ МИГРАЦИОННОГО УЧЕТА ===
function getMigrationModule() {
    const presentCount = systemData.migration.filter(m => !m.exitDate && !isOverstayed(m)).length;
    const overstayedCount = systemData.migration.filter(m => isOverstayed(m)).length;
    
    return `
        <div class="module">
            <div class="module-header">
                <h2>🛂 МИГРАЦИОННЫЙ УЧЕТ И КОНТРОЛЬ</h2>
                <div class="header-stats">
                    <span class="stat">Всего: ${systemData.migration.length}</span>
                    <span class="stat">На территории: ${presentCount}</span>
                    <span class="stat">Просрочено: ${overstayedCount}</span>
                </div>
            </div>
            
            <div class="module-controls">
                <div class="search-box">
                    <input type="text" id="searchMigration" placeholder="🔍 Поиск по ФИО или паспорту..." onkeyup="searchMigration()">
                </div>
                <select onchange="filterMigrationByStatus(this.value)" class="filter-select">
                    <option value="">Все статусы</option>
                    <option value="active">На территории</option>
                    <option value="departed">Выехал</option>
                    <option value="overstayed">Просрочено</option>
                </select>
                <button class="btn btn-success" onclick="showMigrationForm()">
                    <span class="btn-icon">👤</span> Регистрация мигранта
                </button>
                <button class="btn btn-info" onclick="showBulkMigrationForm()">
                    <span class="btn-icon">📥</span> Групповая регистрация
                </button>
            </div>

            <div id="migrationFormContainer" class="form-container" style="display: none;">
                <div class="form-header">
                    <h3>${editingId ? '✏️ Редактирование миграционной записи' : '👤 Регистрация иностранного гражданина'}</h3>
                    <button class="btn-close" onclick="hideMigrationForm()">×</button>
                </div>
                <form onsubmit="saveMigrationRecord(event)" class="form-content">
                    <div class="form-tabs">
                        <button type="button" class="tab-btn active" onclick="switchMigrationTab('basic')">Основные данные</button>
                        <button type="button" class="tab-btn" onclick="switchMigrationTab('documents')">Документы</button>
                        <button type="button" class="tab-btn" onclick="switchMigrationTab('visa')">Визовый режим</button>
                    </div>
                    
                    <div id="migrationBasicTab" class="tab-content active">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="migrationFullName">ФИО *</label>
                                <input type="text" id="migrationFullName" required>
                            </div>
                            <div class="form-group">
                                <label for="migrationCitizenship">Гражданство *</label>
                                <select id="migrationCitizenship" required>
                                    <option value="">Выберите страну</option>
                                    ${getCountryOptions()}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="migrationBirthDate">Дата рождения *</label>
                                <input type="date" id="migrationBirthDate" required>
                            </div>
                            <div class="form-group">
                                <label for="migrationGender">Пол *</label>
                                <select id="migrationGender" required>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                            <div class="form-group full-width">
                                <label for="migrationBirthPlace">Место рождения</label>
                                <input type="text" id="migrationBirthPlace">
                            </div>
                            <div class="form-group">
                                <label for="migrationEntryDate">Дата въезда *</label>
                                <input type="date" id="migrationEntryDate" required>
                            </div>
                            <div class="form-group">
                                <label for="migrationPurpose">Цель визита *</label>
                                <select id="migrationPurpose" required>
                                    <option value="tourism">Туризм</option>
                                    <option value="work">Работа</option>
                                    <option value="study">Учеба</option>
                                    <option value="business">Бизнес</option>
                                    <option value="private">Частный визит</option>
                                    <option value="transit">Транзит</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="migrationDuration">Срок пребывания (дней) *</label>
                                <input type="number" id="migrationDuration" required min="1" max="365">
                            </div>
                            <div class="form-group full-width">
                                <label for="migrationAddress">Адрес проживания *</label>
                                <input type="text" id="migrationAddress" required>
                            </div>
                            <div class="form-group full-width">
                                <label for="migrationHost">Принимающая сторона</label>
                                <input type="text" id="migrationHost">
                            </div>
                        </div>
                    </div>
                    
                    <div id="migrationDocumentsTab" class="tab-content">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="migrationDocType">Тип документа *</label>
                                <select id="migrationDocType" required>
                                    <option value="passport">Заграничный паспорт</option>
                                    <option value="id_card">ID карта</option>
                                    <option value="certificate">Свидетельство</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="migrationDocNumber">Номер документа *</label>
                                <input type="text" id="migrationDocNumber" required>
                            </div>
                            <div class="form-group">
                                <label for="migrationBorderCrossing">Пункт пропуска</label>
                                <input type="text" id="migrationBorderCrossing">
                            </div>
                        </div>
                    </div>
                    
                    <div id="migrationVisaTab" class="tab-content">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="migrationVisaType">Визовый режим</label>
                                <select id="migrationVisaType">
                                    <option value="none">Без визы</option>
                                    <option value="tourist">Туристическая</option>
                                    <option value="business">Деловая</option>
                                    <option value="work">Рабочая</option>
                                    <option value="student">Учебная</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="migrationVisaNumber">Номер визы</label>
                                <input type="text" id="migrationVisaNumber">
                            </div>
                            <div class="form-group">
                                <label for="migrationVisaExpiry">Срок визы до</label>
                                <input type="date" id="migrationVisaExpiry">
                            </div>
                            <div class="form-group full-width">
                                <label for="migrationNotes">Примечания</label>
                                <textarea id="migrationNotes" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="hideMigrationForm()">Отмена</button>
                        <button type="submit" class="btn btn-primary">
                            ${editingId ? '💾 Обновить' : '✅ Зарегистрировать'}
                        </button>
                    </div>
                </form>
            </div>

            <div class="data-section">
                <div id="migrationTableContainer" class="table-container"></div>
            </div>
        </div>
    `;
}

function getCountryOptions() {
    const countries = [
        'Украина', 'Казахстан', 'Беларусь', 'Узбекистан', 'Таджикистан', 
        'Армения', 'Азербайджан', 'Грузия', 'Молдова', 'Кыргызстан', 'Туркменистан',
        'Китай', 'Вьетнам', 'Турция', 'Сербия', 'Черногория'
    ];
    return countries.map(country => `<option value="${country}">${country}</option>`).join('');
}

function switchMigrationTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Показать выбранную вкладку
    document.getElementById('migration' + tabName.charAt(0).toUpperCase() + tabName.slice(1) + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function showMigrationForm() {
    editingId = null;
    const container = document.getElementById('migrationFormContainer');
    container.style.display = 'block';
    
    // Очистка формы
    const form = container.querySelector('form');
    form.reset();
    document.getElementById('migrationEntryDate').value = new Date().toISOString().split('T')[0];
    
    // Активируем первую вкладку
    switchMigrationTab('basic');
}

function hideMigrationForm() {
    document.getElementById('migrationFormContainer').style.display = 'none';
    editingId = null;
}

function saveMigrationRecord(event) {
    event.preventDefault();
    
    const migrationRecord = {
        id: editingId || Date.now(),
        fullName: document.getElementById('migrationFullName').value,
        citizenship: document.getElementById('migrationCitizenship').value,
        documentType: document.getElementById('migrationDocType').value,
        documentNumber: document.getElementById('migrationDocNumber').value,
        birthDate: document.getElementById('migrationBirthDate').value,
        gender: document.getElementById('migrationGender').value,
        birthPlace: document.getElementById('migrationBirthPlace').value,
        entryDate: document.getElementById('migrationEntryDate').value,
        borderCrossing: document.getElementById('migrationBorderCrossing').value,
        purpose: document.getElementById('migrationPurpose').value,
        duration: parseInt(document.getElementById('migrationDuration').value),
        host: document.getElementById('migrationHost').value,
        address: document.getElementById('migrationAddress').value,
        visaType: document.getElementById('migrationVisaType').value,
        visaNumber: document.getElementById('migrationVisaNumber').value,
        visaExpiry: document.getElementById('migrationVisaExpiry').value,
        notes: document.getElementById('migrationNotes').value,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.nickname,
        registrationNumber: generateMigrationNumber()
    };

    if (editingId) {
        const index = systemData.migration.findIndex(m => m.id === editingId);
        if (index !== -1) {
            systemData.migration[index] = migrationRecord;
            showNotification('✅ Миграционная запись обновлена', 'success');
        }
    } else {
        systemData.migration.push(migrationRecord);
        showNotification('✅ Мигрант успешно зарегистрирован', 'success');
    }
    
    saveAllData();
    loadMigrationTable();
    hideMigrationForm();
}

function generateMigrationNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const number = systemData.migration.length + 1;
    return `МИГ-${year}-${number.toString().padStart(6, '0')}`;
}

function isOverstayed(migrant) {
    if (!migrant.entryDate || !migrant.duration) return false;
    const entryDate = new Date(migrant.entryDate);
    const exitDate = new Date(entryDate.getTime() + migrant.duration * 24 * 60 * 60 * 1000);
    return exitDate < new Date() && !migrant.exitDate;
}

function getMigrationStatus(migrant) {
    if (migrant.exitDate) return 'departed';
    if (isOverstayed(migrant)) return 'overstayed';
    return 'active';
}

function getMigrationStatusLabel(migrant) {
    const status = getMigrationStatus(migrant);
    const labels = {
        active: 'На территории',
        departed: 'Выехал',
        overstayed: 'Просрочено'
    };
    return labels[status] || status;
}

function loadMigrationTable() {
    const container = document.getElementById('migrationTableContainer');
    if (!container) return;
    
    if (systemData.migration.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛂</div>
                <h3>Нет миграционных записей</h3>
                <p>Зарегистрируйте первого иностранного гражданина</p>
                <button class="btn btn-success" onclick="showMigrationForm()">👤 Регистрация мигранта</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ФИО</th>
                        <th>Гражданство</th>
                        <th>Паспорт</th>
                        <th>Въезд</th>
                        <th>Выезд</th>
                        <th>Цель визита</th>
                        <th>Статус</th>
                        <th>Визовый режим</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${systemData.migration.map(record => {
                        const status = getMigrationStatus(record);
                        const statusClass = {
                            active: 'status-success',
                            departed: 'status-info', 
                            overstayed: 'status-danger'
                        }[status];
                        
                        return `
                        <tr>
                            <td>
                                <div class="user-cell">
                                    <span class="user-avatar">${record.gender === 'male' ? '👨' : '👩'}</span>
                                    <div>
                                        <strong>${record.fullName}</strong>
                                        <div class="user-meta">${calculateAge(record.birthDate)} лет</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div class="country-cell">
                                    <span class="country-flag">${getFlag(record.citizenship)}</span>
                                    ${record.citizenship}
                                </div>
                            </td>
                            <td>
                                <div class="document-cell">
                                    <div class="document-type">${record.documentType}</div>
                                    <div class="document-number">${record.documentNumber}</div>
                                </div>
                            </td>
                            <td>${formatDate(record.entryDate)}</td>
                            <td>${record.exitDate ? formatDate(record.exitDate) : '<span class="text-muted">—</span>'}</td>
                            <td>
                                <span class="purpose-badge purpose-${record.purpose}">
                                    ${getPurposeLabel(record.purpose)}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge ${statusClass}">
                                    ${getMigrationStatusLabel(record)}
                                </span>
                            </td>
                            <td>
                                ${record.visaType && record.visaType !== 'none' ? `
                                    <div class="visa-info">
                                        <div>${getVisaLabel(record.visaType)}</div>
                                        ${record.visaExpiry ? `
                                            <div class="visa-expiry ${isVisaExpired(record) ? 'expired' : ''}">
                                                до ${formatDate(record.visaExpiry)}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : '<span class="text-muted">Без визы</span>'}
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editMigration(${record.id})" title="Редактировать">
                                        ✏️
                                    </button>
                                    ${!record.exitDate ? `
                                        <button class="btn btn-sm btn-outline btn-warning" onclick="registerExit(${record.id})" title="Зарегистрировать выезд">
                                            🚪
                                        </button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteMigration(${record.id})" title="Удалить">
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Показано ${systemData.migration.length} записей
            </div>
        </div>
    `;
}

function calculateAge(birthDate) {
    if (!birthDate) return '?';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

function getFlag(country) {
    const flags = {
        'Украина': '🇺🇦', 'Казахстан': '🇰🇿', 'Беларусь': '🇧🇾', 'Узбекистан': '🇺🇿',
        'Таджикистан': '🇹🇯', 'Армения': '🇦🇲', 'Азербайджан': '🇦🇿', 'Грузия': '🇬🇪',
        'Молдова': '🇲🇩', 'Кыргызстан': '🇰🇬', 'Туркменистан': '🇹🇲', 'Китай': '🇨🇳',
        'Вьетнам': '🇻🇳', 'Турция': '🇹🇷', 'Сербия': '🇷🇸', 'Черногория': '🇲🇪'
    };
    return flags[country] || '🏳️';
}

function getPurposeLabel(purpose) {
    const labels = {
        tourism: 'Туризм', work: 'Работа', study: 'Учеба', business: 'Бизнес',
        private: 'Частный', transit: 'Транзит'
    };
    return labels[purpose] || purpose;
}

function getVisaLabel(visaType) {
    const labels = {
        tourist: 'Туристическая', business: 'Деловая', work: 'Рабочая', student: 'Учебная'
    };
    return labels[visaType] || visaType;
}

function isVisaExpired(record) {
    if (!record.visaExpiry) return false;
    return new Date(record.visaExpiry) < new Date();
}

function editMigration(id) {
    const record = systemData.migration.find(m => m.id === id);
    if (record) {
        editingId = id;
        const container = document.getElementById('migrationFormContainer');
        container.style.display = 'block';
        
        // Основные данные
        document.getElementById('migrationFullName').value = record.fullName;
        document.getElementById('migrationCitizenship').value = record.citizenship;
        document.getElementById('migrationBirthDate').value = record.birthDate;
        document.getElementById('migrationGender').value = record.gender;
        document.getElementById('migrationBirthPlace').value = record.birthPlace || '';
        document.getElementById('migrationEntryDate').value = record.entryDate;
        document.getElementById('migrationPurpose').value = record.purpose;
        document.getElementById('migrationDuration').value = record.duration;
        document.getElementById('migrationHost').value = record.host || '';
        document.getElementById('migrationAddress').value = record.address;
        
        // Документы
        document.getElementById('migrationDocType').value = record.documentType;
        document.getElementById('migrationDocNumber').value = record.documentNumber;
        document.getElementById('migrationBorderCrossing').value = record.borderCrossing || '';
        
        // Визовый режим
        document.getElementById('migrationVisaType').value = record.visaType || 'none';
        document.getElementById('migrationVisaNumber').value = record.visaNumber || '';
        document.getElementById('migrationVisaExpiry').value = record.visaExpiry || '';
        document.getElementById('migrationNotes').value = record.notes || '';
        
        // Активируем первую вкладку
        switchMigrationTab('basic');
    }
}

function registerExit(id) {
    const record = systemData.migration.find(m => m.id === id);
    if (record && !record.exitDate) {
        record.exitDate = new Date().toISOString().split('T')[0];
        record.status = 'departed';
        saveAllData();
        loadMigrationTable();
        showNotification('✅ Выезд зарегистрирован', 'success');
    }
}

function deleteMigration(id) {
    if (confirm('Вы уверены, что хотите удалить миграционную запись?')) {
        systemData.migration = systemData.migration.filter(m => m.id !== id);
        saveAllData();
        loadMigrationTable();
        showNotification('✅ Миграционная запись удалена', 'success');
    }
}

function searchMigration() {
    const searchTerm = document.getElementById('searchMigration').value.toLowerCase();
    const container = document.getElementById('migrationTableContainer');
    
    if (!searchTerm) {
        loadMigrationTable();
        return;
    }
    
    const filtered = systemData.migration.filter(record =>
        record.fullName.toLowerCase().includes(searchTerm) ||
        record.documentNumber.toLowerCase().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить поисковый запрос</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ФИО</th>
                        <th>Гражданство</th>
                        <th>Паспорт</th>
                        <th>Въезд</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(record => `
                        <tr>
                            <td>${record.fullName}</td>
                            <td>${record.citizenship}</td>
                            <td>${record.documentNumber}</td>
                            <td>${formatDate(record.entryDate)}</td>
                            <td>${getMigrationStatusLabel(record)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editMigration(${record.id})">✏️</button>
                                    ${!record.exitDate ? `
                                        <button class="btn btn-sm btn-outline btn-warning" onclick="registerExit(${record.id})">🚪</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteMigration(${record.id})">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Найдено ${filtered.length} из ${systemData.migration.length} записей
            </div>
        </div>
    `;
}

function filterMigrationByStatus(status) {
    let filtered = systemData.migration;
    
    if (status === 'active') {
        filtered = systemData.migration.filter(m => !m.exitDate && !isOverstayed(m));
    } else if (status === 'departed') {
        filtered = systemData.migration.filter(m => m.exitDate);
    } else if (status === 'overstayed') {
        filtered = systemData.migration.filter(m => isOverstayed(m));
    }
    
    const container = document.getElementById('migrationTableContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Нет записей с выбранным статусом</h3>
                <p>Попробуйте выбрать другой фильтр</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ФИО</th>
                        <th>Гражданство</th>
                        <th>Паспорт</th>
                        <th>Въезд</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(record => `
                        <tr>
                            <td>${record.fullName}</td>
                            <td>${record.citizenship}</td>
                            <td>${record.documentNumber}</td>
                            <td>${formatDate(record.entryDate)}</td>
                            <td>${getMigrationStatusLabel(record)}</td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="editMigration(${record.id})">✏️</button>
                                    ${!record.exitDate ? `
                                        <button class="btn btn-sm btn-outline btn-warning" onclick="registerExit(${record.id})">🚪</button>
                                    ` : ''}
                                    <button class="btn btn-sm btn-outline btn-danger" onclick="deleteMigration(${record.id})">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="table-footer">
            <div class="table-stats">
                Показано ${filtered.length} записей
            </div>
        </div>
    `;
}

function showBulkMigrationForm() {
    // Реализация групповой регистрации
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📥 Групповая регистрация мигрантов</h3>
                <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body">
                <p>Загрузите CSV файл с данными мигрантов или введите данные вручную:</p>
                <textarea id="bulkMigrationData" rows="10" placeholder="ФИО;Гражданство;Документ;Номер;Дата въезда;Цель визита&#10;Иванов Иван;Украина;паспорт;AB123456;2024-01-15;работа&#10;Петров Петр;Казахстан;паспорт;CD789012;2024-01-16;туризм" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Отмена</button>
                <button class="btn btn-primary" onclick="processBulkMigration()">✅ Обработать</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function processBulkMigration() {
    const data = document.getElementById('bulkMigrationData').value;
    if (!data) {
        showNotification('❌ Введите данные для обработки', 'error');
        return;
    }
    
    // Простая обработка CSV
    const lines = data.split('\n');
    let processed = 0;
    
    lines.forEach(line => {
        if (line.trim()) {
            const parts = line.split(';');
            if (parts.length >= 5) {
                const record = {
                    id: Date.now() + Math.random(),
                    fullName: parts[0].trim(),
                    citizenship: parts[1].trim(),
                    documentType: 'passport',
                    documentNumber: parts[3].trim(),
                    entryDate: parts[4].trim(),
                    purpose: parts[5]?.trim() || 'tourism',
                    duration: 30,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser.nickname,
                    registrationNumber: generateMigrationNumber()
                };
                systemData.migration.push(record);
                processed++;
            }
        }
    });
    
    saveAllData();
    loadMigrationTable();
    document.querySelector('.modal-overlay').remove();
    showNotification(`✅ Обработано ${processed} записей`, 'success');
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function formatDate(dateString) {
    if (!dateString) return '<span class="text-muted">—</span>';
    try {
        return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
        return dateString;
    }
}

// === ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ===
async function initSystem() {
    console.log('🚀 Инициализация системы МВД...');
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Обновляем информацию о пользователе
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <div class="user-info">
                <strong>${currentUser.fullName}</strong>
                <small>${currentUser.position} | ${currentUser.rank}</small>
            </div>
        `;
    }
    
    await loadAllData();
    showModule('dashboard');
    
    // Добавляем инструменты отладки
    addDebugTools();
    
    showNotification('✅ Система МВД готова к работе', 'success');
}

function addDebugTools() {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'debug-tools';
    debugDiv.innerHTML = `
        <div style="position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-size: 12px; z-index: 9999;">
            <div style="margin-bottom: 10px;"><strong>🔧 Инструменты разработчика</strong></div>
            <button onclick="showDataStats()" class="btn" style="margin: 2px; padding: 5px 10px; font-size: 12px; background: #3498db; color: white;">📊 Статистика</button>
            <button onclick="exportToFile()" class="btn btn-success" style="margin: 2px; padding: 5px 10px; font-size: 12px;">💾 Экспорт</button>
            <button onclick="document.getElementById('importFile').click()" class="btn btn-warning" style="margin: 2px; padding: 5px 10px; font-size: 12px;">📁 Импорт</button>
            <button onclick="clearAllData()" class="btn btn-danger" style="margin: 2px; padding: 5px 10px; font-size: 12px;">🗑️ Очистить</button>
        </div>
    `;
    document.body.appendChild(debugDiv);
}

function showDataStats() {
    const stats = {
        citizens: systemData.citizens.length,
        drivers: systemData.drivers.length,
        migration: systemData.migration.length,
        pdn: systemData.pdn.length,
        cusp: systemData.cusp.length,
        adminProtocols: systemData.adminProtocols.length,
        criminalCases: systemData.criminalCases.length,
        wanted: systemData.wanted.length,
        debtors: systemData.debtors.length,
        journal: systemData.journal.length,
        news: systemData.news.length,
        operational: systemData.operational.length
    };
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    alert(`
📊 СТАТИСТИКА СИСТЕМЫ МВД:

👥 Граждане: ${stats.citizens}
🚗 Водители: ${stats.drivers}
🛂 Миграция: ${stats.migration}
👶 ПДН: ${stats.pdn}
📝 КУСП: ${stats.cusp}
📄 Протоколы: ${stats.adminProtocols}
🔍 Уголовные дела: ${stats.criminalCases}
🕵️ Розыск: ${stats.wanted}
💳 Должники: ${stats.debtors}
📓 Журнал: ${stats.journal}
📰 Новости: ${stats.news}
📋 Оперативный учет: ${stats.operational}

✅ Всего записей: ${total}
    `);
}

async function clearAllData() {
    if (confirm('❌ ОПАСНО! Удалить ВСЕ данные из системы? Это действие нельзя отменить!')) {
        systemData = {
            citizens: [], drivers: [], migration: [], pdn: [], cusp: [], adminProtocols: [], criminalCases: [], wanted: [],
            stateSecret: {terrorists: [], terroristOrgs: [], extremists: [], unwanted: [], foreignAgents: [], sorm: []},
            debtors: [], journal: [], news: [], operational: []
        };
        await saveAllData();
        showModule(currentModule);
        showNotification('🗑️ Все данные очищены', 'warning');
    }
}

function logout() {
    localStorage.removeItem('mvd_current_user');
    window.location.href = 'auth.html';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    currentUser = JSON.parse(localStorage.getItem('mvd_current_user'));
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    initSystem();
});

// === ДОПОЛНИТЕЛЬНЫЕ МОДУЛИ (кратко) ===
function getPDNModule() {
    return `<div class="module"><h2>👶 Учет в ПДН</h2><p>Модуль в разработке</p></div>`;
}

function getOperationalModule() {
    return `<div class="module"><h2>📋 Оперативный учет</h2><p>Модуль в разработке</p></div>`;
}

function getCUSPModule() {
    return `<div class="module"><h2>📝 КУСП</h2><p>Модуль в разработке</p></div>`;
}

function getAdminProtocolsModule() {
    return `<div class="module"><h2>📄 Административные протоколы</h2><p>Модуль в разработке</p></div>`;
}

function getCriminalCasesModule() {
    return `<div class="module"><h2>🔍 Уголовные дела</h2><p>Модуль в разработке</p></div>`;
}

function getWantedModule() {
    return `<div class="module"><h2>🕵️ Розыск</h2><p>Модуль в разработке</p></div>`;
}

function getStateSecretModule() {
    return `<div class="module"><h2>🔐 Государственная тайна</h2><p>Модуль в разработке</p></div>`;
}

function getDebtorsModule() {
    return `<div class="module"><h2>💳 База должников</h2><p>Модуль в разработке</p></div>`;
}

function getJournalModule() {
    return `<div class="module"><h2>📓 Оперативный журнал</h2><p>Модуль в разработке</p></div>`;
}

function getNewsModule() {
    return `<div class="module"><h2>📰 Новости</h2><p>Модуль в разработке</p></div>`;
}

function getGamesModule() {
    return `<div class="module"><h2>🎮 Мини-игры</h2><p>Модуль в разработке</p></div>`;
}

function getDashboardModule() {
    const stats = {
        citizens: systemData.citizens.length,
        drivers: systemData.drivers.length,
        migration: systemData.migration.length,
        cusp: systemData.cusp.length
    };
    
    return `
        <div class="module">
            <h2>📊 Главная панель</h2>
            
            <div class="import-export-tools" style="margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h3>🔄 Управление данными</h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <div>
                        <input type="file" id="importFile" accept=".json" style="display: none;" onchange="importFromFile(event)">
                        <button class="btn btn-success" onclick="document.getElementById('importFile').click()">
                            📁 Импорт из файла
                        </button>
                    </div>
                    <button class="btn btn-warning" onclick="exportToFile()">💾 Экспорт в файл</button>
                    <button class="btn btn-info" onclick="showDataStats()">📊 Статистика</button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.citizens}</div>
                        <div class="stat-label">Граждане</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🚗</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.drivers}</div>
                        <div class="stat-label">Водители</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🛂</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.migration}</div>
                        <div class="stat-label">Мигранты</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <div class="stat-number">${stats.cusp}</div>
                        <div class="stat-label">КУСП</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Функции загрузки таблиц для остальных модулей
function loadPDNTable() {}
function loadOperationalTable() {}
function loadCUSPTable() {}
function loadAdminProtocolsTable() {}
function loadCriminalCasesTable() {}
function loadWantedTable() {}
function loadStateSecretData() {}
function loadDebtorsTable() {}
function loadJournalEntries() {}
function loadNews() {}
