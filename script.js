// Глобальные переменные
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
        foreignAgents: []
    },
    debtors: [],
    journal: [],
    news: [],
    operational: []
};

let currentUser = null;
let currentModule = 'dashboard';
let editingId = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    currentUser = JSON.parse(localStorage.getItem('mvd_current_user'));
    
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    initSystem();
});

async function initSystem() {
    // Показываем уведомление о загрузке
    showNotification('🔄 Загрузка данных из Firebase...', 'info');
    
    await loadAllData();
    initRealtimeUpdates();
    updateUserInfo();
    showModule('dashboard');
    
    // Проверяем подключение
    setTimeout(() => {
        if (systemData.citizens.length === 0) {
            showNotification('⚠️ База пустая, добавьте первого гражданина', 'warning');
        } else {
            showNotification('✅ Система готова к работе', 'success');
        }
    }, 2000);
}

function updateUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <strong>${currentUser.fullName}</strong><br>
            <small>${currentUser.position} | ${currentUser.rank}</small>
        `;
    }
}

function logout() {
    localStorage.removeItem('mvd_current_user');
    window.location.href = 'auth.html';
}

// === FIREBASE ФУНКЦИИ ===
function initRealtimeUpdates() {
    database.ref('systemData/').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            systemData = data;
            updateCurrentModule();
            showNotification('🔄 Данные обновлены', 'info');
        }
    });
}

async function loadAllData() {
    try {
        const snapshot = await database.ref('systemData/').once('value');
        const data = snapshot.val();
        if (data) {
            systemData = data;
            console.log('✅ Данные загружены из Firebase');
        } else {
            console.log('ℹ️ База данных пустая');
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        showNotification('❌ Ошибка загрузки данных', 'error');
        
        // Пробуем загрузить из резервной копии
        const backup = localStorage.getItem('mvd_backup');
        if (backup) {
            systemData = JSON.parse(backup);
            console.log('✅ Данные загружены из резервной копии');
        }
    }
}

async function saveAllData() {
    try {
        await database.ref('systemData').set(systemData);
        console.log('✅ Данные сохранены в Firebase');
        
        // Сохраняем резервную копию
        localStorage.setItem('mvd_backup', JSON.stringify(systemData));
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        showNotification('❌ Ошибка сохранения данных', 'error');
        
        // Сохраняем в localStorage как резерв
        try {
            localStorage.setItem('mvd_backup', JSON.stringify(systemData));
            console.log('⚠️ Данные сохранены в localStorage');
        } catch (e) {
            console.error('❌ Ошибка резервного сохранения:', e);
        }
        return false;
    }
}

// === ФУНКЦИЯ УВЕДОМЛЕНИЙ ===
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        font-weight: bold;
        max-width: 300px;
        transition: all 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c', 
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

// === ФУНКЦИЯ ДЛЯ СКРЫТИЯ ВСЕХ ФОРМ ===
function hideAllForms() {
    const forms = [
        'citizenFormContainer', 'driverFormContainer', 'migrationFormContainer',
        'pdnFormContainer', 'operationalFormContainer', 'cuspFormContainer',
        'adminProtocolFormContainer', 'criminalCaseFormContainer', 'wantedFormContainer',
        'debtorFormContainer'
    ];
    
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) form.style.display = 'none';
    });
    editingId = null;
}

// === ОСНОВНЫЕ МОДУЛИ ===
function showModule(moduleName) {
    currentModule = moduleName;
    
    // Скрываем все формы при переключении модулей
    hideAllForms();
    
    editingId = null;
    const moduleContent = document.getElementById('moduleContent');
    
    switch(moduleName) {
        case 'citizens':
            moduleContent.innerHTML = getCitizensModule();
            loadCitizensTable();
            break;
        case 'drivers':
            moduleContent.innerHTML = getDriversModule();
            loadDriversTable();
            break;
        case 'migration':
            moduleContent.innerHTML = getMigrationModule();
            loadMigrationTable();
            break;
        case 'pdn':
            moduleContent.innerHTML = getPDNModule();
            loadPDNTable();
            break;
        case 'operational':
            moduleContent.innerHTML = getOperationalModule();
            loadOperationalTable();
            break;
        case 'cusp':
            moduleContent.innerHTML = getCUSPModule();
            loadCUSPTable();
            break;
        case 'admin_protocols':
            moduleContent.innerHTML = getAdminProtocolsModule();
            loadAdminProtocolsTable();
            break;
        case 'criminal_cases':
            moduleContent.innerHTML = getCriminalCasesModule();
            loadCriminalCasesTable();
            break;
        case 'wanted':
            moduleContent.innerHTML = getWantedModule();
            loadWantedTable();
            break;
        case 'state_secret':
            moduleContent.innerHTML = getStateSecretModule();
            loadStateSecretData();
            break;
        case 'debtors':
            moduleContent.innerHTML = getDebtorsModule();
            loadDebtorsTable();
            break;
        case 'journal':
            moduleContent.innerHTML = getJournalModule();
            loadJournalEntries();
            break;
        case 'news':
            moduleContent.innerHTML = getNewsModule();
            loadNews();
            break;
        case 'games':
            moduleContent.innerHTML = getGamesModule();
            break;
        default:
            moduleContent.innerHTML = getDashboardModule();
    }
}

function updateCurrentModule() {
    showModule(currentModule);
}

// === МОДУЛЬ БАЗЫ ГРАЖДАН ===
function getCitizensModule() {
    return `
        <div class="module">
            <h2>👥 База данных граждан</h2>
            <div class="search-box">
                <input type="text" id="searchCitizens" placeholder="Поиск по ФИО или никнейму..." onkeyup="searchCitizens()">
            </div>
            <button class="btn btn-success" onclick="showCitizenForm()">➕ Добавить гражданина</button>
            
            <div id="citizenFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Добавление'} гражданина</h3>
                <form onsubmit="saveCitizen(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="citizenNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="citizenFullName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Дата рождения:</label>
                            <input type="date" id="citizenBirthDate">
                        </div>
                        <div class="form-group">
                            <label>Номер паспорта:</label>
                            <input type="text" id="citizenPassport">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Место регистрации:</label>
                        <input type="text" id="citizenAddress">
                    </div>
                    <div class="form-group">
                        <label>Дополнительная информация:</label>
                        <textarea id="citizenAdditionalInfo" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="citizenCriminalRecord"> Имеет судимость
                        </label>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideCitizenForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="citizensTableContainer"></div>
        </div>
    `;
}

function showCitizenForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('citizenFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('citizenNickname').value = '';
        document.getElementById('citizenFullName').value = '';
        document.getElementById('citizenBirthDate').value = '';
        document.getElementById('citizenPassport').value = '';
        document.getElementById('citizenAddress').value = '';
        document.getElementById('citizenAdditionalInfo').value = '';
        document.getElementById('citizenCriminalRecord').checked = false;
    }
}

function hideCitizenForm() {
    const form = document.getElementById('citizenFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
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
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.citizens.findIndex(c => c.id === editingId);
        if (index !== -1) {
            systemData.citizens[index] = citizen;
        }
    } else {
        systemData.citizens.push(citizen);
    }
    
    if (saveAllData()) {
        showNotification('✅ Гражданин сохранен', 'success');
    }
    loadCitizensTable();
    hideCitizenForm();
}

function editCitizen(id) {
    const citizen = systemData.citizens.find(c => c.id === id);
    if (citizen) {
        editingId = id;
        const form = document.getElementById('citizenFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('citizenNickname').value = citizen.nickname;
            document.getElementById('citizenFullName').value = citizen.fullName;
            document.getElementById('citizenBirthDate').value = citizen.birthDate;
            document.getElementById('citizenPassport').value = citizen.passportNumber;
            document.getElementById('citizenAddress').value = citizen.address;
            document.getElementById('citizenAdditionalInfo').value = citizen.additionalInfo;
            document.getElementById('citizenCriminalRecord').checked = citizen.criminalRecord;
        }
    }
}

function loadCitizensTable() {
    const container = document.getElementById('citizensTableContainer');
    if (!container) return;
    
    if (systemData.citizens.length === 0) {
        container.innerHTML = '<div class="loading">Нет данных о гражданах</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Дата рождения</th>
                    <th>Паспорт</th>
                    <th>Адрес</th>
                    <th>Судимость</th>
                    <th>Добавил</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.citizens.map(citizen => `
                    <tr>
                        <td>${citizen.nickname}</td>
                        <td>${citizen.fullName}</td>
                        <td>${citizen.birthDate || '-'}</td>
                        <td>${citizen.passportNumber || '-'}</td>
                        <td>${citizen.address || '-'}</td>
                        <td>${citizen.criminalRecord ? '✅' : '❌'}</td>
                        <td>${citizen.createdBy}</td>
                        <td>
                            <button class="btn" onclick="editCitizen(${citizen.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteCitizen(${citizen.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 10px; color: #666;">
            Всего записей: ${systemData.citizens.length}
        </div>
    `;
}

function searchCitizens() {
    const searchTerm = document.getElementById('searchCitizens').value.toLowerCase();
    const container = document.getElementById('citizensTableContainer');
    
    const filteredCitizens = systemData.citizens.filter(citizen => 
        citizen.nickname.toLowerCase().includes(searchTerm) ||
        citizen.fullName.toLowerCase().includes(searchTerm)
    );
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Дата рождения</th>
                    <th>Паспорт</th>
                    <th>Адрес</th>
                    <th>Судимость</th>
                    <th>Добавил</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${filteredCitizens.map(citizen => `
                    <tr>
                        <td>${citizen.nickname}</td>
                        <td>${citizen.fullName}</td>
                        <td>${citizen.birthDate || '-'}</td>
                        <td>${citizen.passportNumber || '-'}</td>
                        <td>${citizen.address || '-'}</td>
                        <td>${citizen.criminalRecord ? '✅' : '❌'}</td>
                        <td>${citizen.createdBy}</td>
                        <td>
                            <button class="btn" onclick="editCitizen(${citizen.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteCitizen(${citizen.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 10px; color: #666;">
            Найдено: ${filteredCitizens.length} из ${systemData.citizens.length}
        </div>
    `;
}

function deleteCitizen(id) {
    if (confirm('Удалить гражданина из базы?')) {
        systemData.citizens = systemData.citizens.filter(c => c.id !== id);
        if (saveAllData()) {
            showNotification('✅ Гражданин удален', 'success');
        }
        loadCitizensTable();
    }
}

// === МОДУЛЬ БАЗЫ ВОДИТЕЛЕЙ ===
function getDriversModule() {
    return `
        <div class="module">
            <h2>🚗 База данных водителей</h2>
            <button class="btn btn-success" onclick="showDriverForm()">➕ Добавить водителя</button>
            
            <div id="driverFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Добавление'} водителя</h3>
                <form onsubmit="saveDriver(event)">
                    <div class="form-group">
                        <label>Выберите гражданина:</label>
                        <select id="driverCitizen" required>
                            <option value="">Выберите гражданина</option>
                            ${systemData.citizens.map(c => `<option value="${c.id}">${c.nickname} - ${c.fullName}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Номер В/У:</label>
                            <input type="text" id="driverLicenseNumber" required>
                        </div>
                        <div class="form-group">
                            <label>Категории:</label>
                            <input type="text" id="driverCategories" placeholder="A,B,C,D" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Административные штрафы:</label>
                        <textarea id="driverFines" placeholder="Дата, сумма, нарушение..." rows="3"></textarea>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideDriverForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="driversTableContainer"></div>
        </div>
    `;
}

function showDriverForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('driverFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('driverLicenseNumber').value = '';
        document.getElementById('driverCategories').value = '';
        document.getElementById('driverFines').value = '';
    }
}

function hideDriverForm() {
    const form = document.getElementById('driverFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveDriver(event) {
    event.preventDefault();
    
    const citizenId = parseInt(document.getElementById('driverCitizen').value);
    const citizen = systemData.citizens.find(c => c.id === citizenId);
    
    if (!citizen) {
        showNotification('❌ Гражданин не найден', 'error');
        return;
    }
    
    const driver = {
        id: editingId || Date.now(),
        citizenId: citizenId,
        citizenNickname: citizen.nickname,
        citizenFullName: citizen.fullName,
        licenseNumber: document.getElementById('driverLicenseNumber').value,
        categories: document.getElementById('driverCategories').value,
        fines: document.getElementById('driverFines').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.drivers.findIndex(d => d.id === editingId);
        if (index !== -1) {
            systemData.drivers[index] = driver;
        }
    } else {
        systemData.drivers.push(driver);
    }
    
    if (saveAllData()) {
        showNotification('✅ Водитель сохранен', 'success');
    }
    loadDriversTable();
    hideDriverForm();
}

function editDriver(id) {
    const driver = systemData.drivers.find(d => d.id === id);
    if (driver) {
        editingId = id;
        const form = document.getElementById('driverFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('driverCitizen').value = driver.citizenId;
            document.getElementById('driverLicenseNumber').value = driver.licenseNumber;
            document.getElementById('driverCategories').value = driver.categories;
            document.getElementById('driverFines').value = driver.fines;
        }
    }
}

function loadDriversTable() {
    const container = document.getElementById('driversTableContainer');
    if (!container) return;
    
    if (systemData.drivers.length === 0) {
        container.innerHTML = '<div class="loading">Нет данных о водителях</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Номер В/У</th>
                    <th>Категории</th>
                    <th>Штрафы</th>
                    <th>Добавил</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.drivers.map(driver => `
                    <tr>
                        <td>${driver.citizenNickname}</td>
                        <td>${driver.citizenFullName}</td>
                        <td>${driver.licenseNumber}</td>
                        <td>${driver.categories}</td>
                        <td>${driver.fines || 'нет'}</td>
                        <td>${driver.createdBy}</td>
                        <td>
                            <button class="btn" onclick="editDriver(${driver.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteDriver(${driver.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteDriver(id) {
    if (confirm('Удалить водителя из базы?')) {
        systemData.drivers = systemData.drivers.filter(d => d.id !== id);
        if (saveAllData()) {
            showNotification('✅ Водитель удален', 'success');
        }
        loadDriversTable();
    }
}

// === МОДУЛЬ МИГРАЦИОННОГО УЧЕТА ===
function getMigrationModule() {
    return `
        <div class="module">
            <h2>🛂 Миграционный учет и контроль</h2>
            <button class="btn btn-success" onclick="showMigrationForm()">➕ Добавить запись</button>
            
            <div id="migrationFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Добавление'} миграционной записи</h3>
                <form onsubmit="saveMigrationRecord(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="migrationNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="migrationFullName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Гражданство:</label>
                            <input type="text" id="migrationCitizenship" required>
                        </div>
                        <div class="form-group">
                            <label>Дата въезда:</label>
                            <input type="date" id="migrationEntryDate" required>
                        </div>
                        <div class="form-group">
                            <label>Дата выезда:</label>
                            <input type="date" id="migrationExitDate">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Цель визита:</label>
                        <input type="text" id="migrationPurpose">
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideMigrationForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="migrationTableContainer"></div>
        </div>
    `;
}

function showMigrationForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('migrationFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('migrationNickname').value = '';
        document.getElementById('migrationFullName').value = '';
        document.getElementById('migrationCitizenship').value = '';
        document.getElementById('migrationEntryDate').value = '';
        document.getElementById('migrationExitDate').value = '';
        document.getElementById('migrationPurpose').value = '';
    }
}

function hideMigrationForm() {
    const form = document.getElementById('migrationFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveMigrationRecord(event) {
    event.preventDefault();
    
    const migration = {
        id: editingId || Date.now(),
        nickname: document.getElementById('migrationNickname').value,
        fullName: document.getElementById('migrationFullName').value,
        citizenship: document.getElementById('migrationCitizenship').value,
        entryDate: document.getElementById('migrationEntryDate').value,
        exitDate: document.getElementById('migrationExitDate').value,
        purpose: document.getElementById('migrationPurpose').value,
        status: document.getElementById('migrationExitDate').value ? 'Выехал' : 'На территории',
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.migration.findIndex(m => m.id === editingId);
        if (index !== -1) {
            systemData.migration[index] = migration;
        }
    } else {
        systemData.migration.push(migration);
    }
    
    if (saveAllData()) {
        showNotification('✅ Миграционная запись сохранена', 'success');
    }
    loadMigrationTable();
    hideMigrationForm();
}

function editMigration(id) {
    const migration = systemData.migration.find(m => m.id === id);
    if (migration) {
        editingId = id;
        const form = document.getElementById('migrationFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('migrationNickname').value = migration.nickname;
            document.getElementById('migrationFullName').value = migration.fullName;
            document.getElementById('migrationCitizenship').value = migration.citizenship;
            document.getElementById('migrationEntryDate').value = migration.entryDate;
            document.getElementById('migrationExitDate').value = migration.exitDate;
            document.getElementById('migrationPurpose').value = migration.purpose;
        }
    }
}

function loadMigrationTable() {
    const container = document.getElementById('migrationTableContainer');
    if (!container) return;
    
    if (systemData.migration.length === 0) {
        container.innerHTML = '<div class="loading">Нет миграционных записей</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Гражданство</th>
                    <th>Въезд</th>
                    <th>Выезд</th>
                    <th>Статус</th>
                    <th>Цель</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.migration.map(record => `
                    <tr>
                        <td>${record.nickname}</td>
                        <td>${record.fullName}</td>
                        <td>${record.citizenship}</td>
                        <td>${record.entryDate}</td>
                        <td>${record.exitDate || '-'}</td>
                        <td><span style="color: ${record.status === 'На территории' ? 'green' : 'red'}">${record.status}</span></td>
                        <td>${record.purpose || '-'}</td>
                        <td>
                            <button class="btn" onclick="editMigration(${record.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteMigration(${record.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteMigration(id) {
    if (confirm('Удалить миграционную запись?')) {
        systemData.migration = systemData.migration.filter(m => m.id !== id);
        if (saveAllData()) {
            showNotification('✅ Миграционная запись удалена', 'success');
        }
        loadMigrationTable();
    }
}

// === МОДУЛЬ УЧЕТА ПДН ===
function getPDNModule() {
    return `
        <div class="module">
            <h2>👶 Учет в ПДН (Подразделение по делам несовершеннолетних)</h2>
            <button class="btn btn-success" onclick="showPDNForm()">➕ Поставить на учет</button>
            
            <div id="pdnFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Постановка'} на учет ПДН</h3>
                <form onsubmit="savePDNRecord(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="pdnNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="pdnFullName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Дата рождения:</label>
                            <input type="date" id="pdnBirthDate" required>
                        </div>
                        <div class="form-group">
                            <label>Учебное заведение:</label>
                            <input type="text" id="pdnSchool" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Причина постановки на учет:</label>
                        <textarea id="pdnReason" rows="3" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Дата постановки:</label>
                        <input type="date" id="pdnRegistrationDate" required>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hidePDNForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="pdnTableContainer"></div>
        </div>
    `;
}

function showPDNForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('pdnFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('pdnNickname').value = '';
        document.getElementById('pdnFullName').value = '';
        document.getElementById('pdnBirthDate').value = '';
        document.getElementById('pdnSchool').value = '';
        document.getElementById('pdnReason').value = '';
        document.getElementById('pdnRegistrationDate').value = '';
    }
}

function hidePDNForm() {
    const form = document.getElementById('pdnFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function savePDNRecord(event) {
    event.preventDefault();
    
    const pdn = {
        id: editingId || Date.now(),
        nickname: document.getElementById('pdnNickname').value,
        fullName: document.getElementById('pdnFullName').value,
        birthDate: document.getElementById('pdnBirthDate').value,
        school: document.getElementById('pdnSchool').value,
        reason: document.getElementById('pdnReason').value,
        registrationDate: document.getElementById('pdnRegistrationDate').value,
        status: 'На учете',
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.pdn.findIndex(p => p.id === editingId);
        if (index !== -1) {
            systemData.pdn[index] = pdn;
        }
    } else {
        systemData.pdn.push(pdn);
    }
    
    if (saveAllData()) {
        showNotification('✅ Запись ПДН сохранена', 'success');
    }
    loadPDNTable();
    hidePDNForm();
}

function editPDN(id) {
    const pdn = systemData.pdn.find(p => p.id === id);
    if (pdn) {
        editingId = id;
        const form = document.getElementById('pdnFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('pdnNickname').value = pdn.nickname;
            document.getElementById('pdnFullName').value = pdn.fullName;
            document.getElementById('pdnBirthDate').value = pdn.birthDate;
            document.getElementById('pdnSchool').value = pdn.school;
            document.getElementById('pdnReason').value = pdn.reason;
            document.getElementById('pdnRegistrationDate').value = pdn.registrationDate;
        }
    }
}

function loadPDNTable() {
    const container = document.getElementById('pdnTableContainer');
    if (!container) return;
    
    if (systemData.pdn.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей ПДН</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Дата рождения</th>
                    <th>Учебное заведение</th>
                    <th>Причина</th>
                    <th>Дата постановки</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.pdn.map(record => `
                    <tr>
                        <td>${record.nickname}</td>
                        <td>${record.fullName}</td>
                        <td>${record.birthDate}</td>
                        <td>${record.school}</td>
                        <td>${record.reason}</td>
                        <td>${record.registrationDate}</td>
                        <td>${record.status}</td>
                        <td>
                            <button class="btn" onclick="editPDN(${record.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deletePDN(${record.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deletePDN(id) {
    if (confirm('Удалить запись из учета ПДН?')) {
        systemData.pdn = systemData.pdn.filter(p => p.id !== id);
        if (saveAllData()) {
            showNotification('✅ Запись ПДН удалена', 'success');
        }
        loadPDNTable();
    }
}

// === МОДУЛЬ ОПЕРАТИВНОГО УЧЕТА ===
function getOperationalModule() {
    return `
        <div class="module">
            <h2>📋 Оперативный учет (База преступников)</h2>
            <button class="btn btn-success" onclick="showOperationalForm()">➕ Добавить запись</button>
            
            <div id="operationalFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Добавление'} в оперативный учет</h3>
                <form onsubmit="saveOperationalRecord(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="operationalNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="operationalFullName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Дата рождения:</label>
                            <input type="date" id="operationalBirthDate">
                        </div>
                        <div class="form-group">
                            <label>Кличка/Прозвище:</label>
                            <input type="text" id="operationalAlias">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Преступная специализация:</label>
                        <input type="text" id="operationalSpecialization" required>
                    </div>
                    <div class="form-group">
                        <label>Приметы:</label>
                        <textarea id="operationalDescription" rows="2"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Последнее известное местонахождение:</label>
                        <input type="text" id="operationalLastLocation">
                    </div>
                    <div class="form-group">
                        <label>Статус:</label>
                        <select id="operationalStatus">
                            <option value="Активен">Активен</option>
                            <option value="Арестован">Арестован</option>
                            <option value="В розыске">В розыске</option>
                            <option value="Условно-досрочно">Условно-досрочно</option>
                        </select>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideOperationalForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="operationalTableContainer"></div>
        </div>
    `;
}

function showOperationalForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('operationalFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('operationalNickname').value = '';
        document.getElementById('operationalFullName').value = '';
        document.getElementById('operationalBirthDate').value = '';
        document.getElementById('operationalAlias').value = '';
        document.getElementById('operationalSpecialization').value = '';
        document.getElementById('operationalDescription').value = '';
        document.getElementById('operationalLastLocation').value = '';
        document.getElementById('operationalStatus').value = 'Активен';
    }
}

function hideOperationalForm() {
    const form = document.getElementById('operationalFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveOperationalRecord(event) {
    event.preventDefault();
    
    const operational = {
        id: editingId || Date.now(),
        nickname: document.getElementById('operationalNickname').value,
        fullName: document.getElementById('operationalFullName').value,
        birthDate: document.getElementById('operationalBirthDate').value,
        alias: document.getElementById('operationalAlias').value,
        specialization: document.getElementById('operationalSpecialization').value,
        description: document.getElementById('operationalDescription').value,
        lastLocation: document.getElementById('operationalLastLocation').value,
        status: document.getElementById('operationalStatus').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.operational.findIndex(o => o.id === editingId);
        if (index !== -1) {
            systemData.operational[index] = operational;
        }
    } else {
        systemData.operational.push(operational);
    }
    
    if (saveAllData()) {
        showNotification('✅ Запись оперативного учета сохранена', 'success');
    }
    loadOperationalTable();
    hideOperationalForm();
}

function editOperational(id) {
    const operational = systemData.operational.find(o => o.id === id);
    if (operational) {
        editingId = id;
        const form = document.getElementById('operationalFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('operationalNickname').value = operational.nickname;
            document.getElementById('operationalFullName').value = operational.fullName;
            document.getElementById('operationalBirthDate').value = operational.birthDate;
            document.getElementById('operationalAlias').value = operational.alias;
            document.getElementById('operationalSpecialization').value = operational.specialization;
            document.getElementById('operationalDescription').value = operational.description;
            document.getElementById('operationalLastLocation').value = operational.lastLocation;
            document.getElementById('operationalStatus').value = operational.status;
        }
    }
}

function loadOperationalTable() {
    const container = document.getElementById('operationalTableContainer');
    if (!container) return;
    
    if (systemData.operational.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей оперативного учета</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Кличка</th>
                    <th>Специализация</th>
                    <th>Последнее место</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.operational.map(record => `
                    <tr>
                        <td>${record.nickname}</td>
                        <td>${record.fullName}</td>
                        <td>${record.alias || '-'}</td>
                        <td>${record.specialization}</td>
                        <td>${record.lastLocation || '-'}</td>
                        <td>${record.status}</td>
                        <td>
                            <button class="btn" onclick="editOperational(${record.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteOperational(${record.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteOperational(id) {
    if (confirm('Удалить запись из оперативного учета?')) {
        systemData.operational = systemData.operational.filter(o => o.id !== id);
        if (saveAllData()) {
            showNotification('✅ Запись оперативного учета удалена', 'success');
        }
        loadOperationalTable();
    }
}

// === МОДУЛЬ КУСП ===
function getCUSPModule() {
    return `
        <div class="module">
            <h2>📝 КУСП (Книга учета сообщений о преступлениях)</h2>
            <button class="btn btn-success" onclick="showCUSPForm()">➕ Добавить сообщение</button>
            
            <div id="cuspFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Регистрация'} сообщения в КУСП</h3>
                <form onsubmit="saveCUSPRecord(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Заявитель (ФИО):</label>
                            <input type="text" id="cuspApplicant" required>
                        </div>
                        <div class="form-group">
                            <label>Контактные данные:</label>
                            <input type="text" id="cuspContacts" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Суть заявления:</label>
                        <textarea id="cuspStatement" rows="4" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Ответственный сотрудник:</label>
                            <input type="text" id="cuspResponsible" value="${currentUser.fullName}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Дата/время:</label>
                            <input type="datetime-local" id="cuspDateTime" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Статус рассмотрения:</label>
                        <select id="cuspStatus">
                            <option value="Зарегистрировано">Зарегистрировано</option>
                            <option value="В работе">В работе</option>
                            <option value="Передано в СО">Передано в СО</option>
                            <option value="Закрыто">Закрыто</option>
                        </select>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideCUSPForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="cuspTableContainer"></div>
        </div>
    `;
}

function showCUSPForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('cuspFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('cuspApplicant').value = '';
        document.getElementById('cuspContacts').value = '';
        document.getElementById('cuspStatement').value = '';
        document.getElementById('cuspDateTime').value = new Date().toISOString().slice(0, 16);
        document.getElementById('cuspStatus').value = 'Зарегистрировано';
    }
}

function hideCUSPForm() {
    const form = document.getElementById('cuspFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveCUSPRecord(event) {
    event.preventDefault();
    
    const cusp = {
        id: editingId || Date.now(),
        applicant: document.getElementById('cuspApplicant').value,
        contacts: document.getElementById('cuspContacts').value,
        statement: document.getElementById('cuspStatement').value,
        responsible: document.getElementById('cuspResponsible').value,
        dateTime: document.getElementById('cuspDateTime').value,
        status: document.getElementById('cuspStatus').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.cusp.findIndex(c => c.id === editingId);
        if (index !== -1) {
            systemData.cusp[index] = cusp;
        }
    } else {
        systemData.cusp.push(cusp);
    }
    
    if (saveAllData()) {
        showNotification('✅ Запись КУСП сохранена', 'success');
    }
    loadCUSPTable();
    hideCUSPForm();
}

function editCUSP(id) {
    const cusp = systemData.cusp.find(c => c.id === id);
    if (cusp) {
        editingId = id;
        const form = document.getElementById('cuspFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('cuspApplicant').value = cusp.applicant;
            document.getElementById('cuspContacts').value = cusp.contacts;
            document.getElementById('cuspStatement').value = cusp.statement;
            document.getElementById('cuspResponsible').value = cusp.responsible;
            document.getElementById('cuspDateTime').value = cusp.dateTime;
            document.getElementById('cuspStatus').value = cusp.status;
        }
    }
}

function loadCUSPTable() {
    const container = document.getElementById('cuspTableContainer');
    if (!container) return;
    
    if (systemData.cusp.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей КУСП</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>№</th>
                    <th>Заявитель</th>
                    <th>Контакты</th>
                    <th>Суть заявления</th>
                    <th>Ответственный</th>
                    <th>Дата/время</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.cusp.map((record, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${record.applicant}</td>
                        <td>${record.contacts}</td>
                        <td>${record.statement.length > 50 ? record.statement.substring(0, 50) + '...' : record.statement}</td>
                        <td>${record.responsible}</td>
                        <td>${new Date(record.dateTime).toLocaleString()}</td>
                        <td>${record.status}</td>
                        <td>
                            <button class="btn" onclick="editCUSP(${record.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteCUSP(${record.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteCUSP(id) {
    if (confirm('Удалить запись КУСП?')) {
        systemData.cusp = systemData.cusp.filter(c => c.id !== id);
        if (saveAllData()) {
            showNotification('✅ Запись КУСП удалена', 'success');
        }
        loadCUSPTable();
    }
}

// === МОДУЛЬ АДМИНИСТРАТИВНЫХ ПРОТОКОЛОВ ===
function getAdminProtocolsModule() {
    return `
        <div class="module">
            <h2>📄 Административные протоколы</h2>
            <button class="btn btn-success" onclick="showAdminProtocolForm()">➕ Составить протокол</button>
            
            <div id="adminProtocolFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Составление'} административного протокола</h3>
                <form onsubmit="saveAdminProtocol(event)">
                    <div class="form-group">
                        <label>Нарушитель (ФИО):</label>
                        <input type="text" id="protocolViolator" required>
                    </div>
                    <div class="form-group">
                        <label>Никнейм нарушителя:</label>
                        <input type="text" id="protocolViolatorNickname">
                    </div>
                    <div class="form-group">
                        <label>Статья КоАП:</label>
                        <input type="text" id="protocolArticle" required placeholder="Например: 12.9 ч.1">
                    </div>
                    <div class="form-group">
                        <label>Обстоятельства нарушения:</label>
                        <textarea id="protocolCircumstances" rows="3" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Место нарушения:</label>
                            <input type="text" id="protocolLocation" required>
                        </div>
                        <div class="form-group">
                            <label>Дата/время:</label>
                            <input type="datetime-local" id="protocolDateTime" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Составитель:</label>
                        <input type="text" id="protocolAuthor" value="${currentUser.fullName}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Статус:</label>
                        <select id="protocolStatus">
                            <option value="Составлен">Составлен</option>
                            <option value="Передан в суд">Передан в суд</option>
                            <option value="Исполнен">Исполнен</option>
                        </select>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить протокол'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideAdminProtocolForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="adminProtocolsTableContainer"></div>
        </div>
    `;
}

function showAdminProtocolForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('adminProtocolFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('protocolViolator').value = '';
        document.getElementById('protocolViolatorNickname').value = '';
        document.getElementById('protocolArticle').value = '';
        document.getElementById('protocolCircumstances').value = '';
        document.getElementById('protocolLocation').value = '';
        document.getElementById('protocolDateTime').value = new Date().toISOString().slice(0, 16);
        document.getElementById('protocolStatus').value = 'Составлен';
    }
}

function hideAdminProtocolForm() {
    const form = document.getElementById('adminProtocolFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveAdminProtocol(event) {
    event.preventDefault();
    
    const protocol = {
        id: editingId || Date.now(),
        violator: document.getElementById('protocolViolator').value,
        violatorNickname: document.getElementById('protocolViolatorNickname').value,
        article: document.getElementById('protocolArticle').value,
        circumstances: document.getElementById('protocolCircumstances').value,
        location: document.getElementById('protocolLocation').value,
        dateTime: document.getElementById('protocolDateTime').value,
        author: document.getElementById('protocolAuthor').value,
        status: document.getElementById('protocolStatus').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.adminProtocols.findIndex(p => p.id === editingId);
        if (index !== -1) {
            systemData.adminProtocols[index] = protocol;
        }
    } else {
        systemData.adminProtocols.push(protocol);
    }
    
    if (saveAllData()) {
        showNotification('✅ Административный протокол сохранен', 'success');
    }
    loadAdminProtocolsTable();
    hideAdminProtocolForm();
}

function editAdminProtocol(id) {
    const protocol = systemData.adminProtocols.find(p => p.id === id);
    if (protocol) {
        editingId = id;
        const form = document.getElementById('adminProtocolFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('protocolViolator').value = protocol.violator;
            document.getElementById('protocolViolatorNickname').value = protocol.violatorNickname;
            document.getElementById('protocolArticle').value = protocol.article;
            document.getElementById('protocolCircumstances').value = protocol.circumstances;
            document.getElementById('protocolLocation').value = protocol.location;
            document.getElementById('protocolDateTime').value = protocol.dateTime;
            document.getElementById('protocolStatus').value = protocol.status;
        }
    }
}

function loadAdminProtocolsTable() {
    const container = document.getElementById('adminProtocolsTableContainer');
    if (!container) return;
    
    if (systemData.adminProtocols.length === 0) {
        container.innerHTML = '<div class="loading">Нет административных протоколов</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>№</th>
                    <th>Нарушитель</th>
                    <th>Никнейм</th>
                    <th>Статья</th>
                    <th>Место</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.adminProtocols.map((protocol, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${protocol.violator}</td>
                        <td>${protocol.violatorNickname || '-'}</td>
                        <td>${protocol.article}</td>
                        <td>${protocol.location}</td>
                        <td>${new Date(protocol.dateTime).toLocaleString()}</td>
                        <td>${protocol.status}</td>
                        <td>
                            <button class="btn" onclick="editAdminProtocol(${protocol.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteAdminProtocol(${protocol.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteAdminProtocol(id) {
    if (confirm('Удалить административный протокол?')) {
        systemData.adminProtocols = systemData.adminProtocols.filter(p => p.id !== id);
        if (saveAllData()) {
            showNotification('✅ Административный протокол удален', 'success');
        }
        loadAdminProtocolsTable();
    }
}

// === МОДУЛЬ УГОЛОВНЫХ ДЕЛ ===
function getCriminalCasesModule() {
    return `
        <div class="module">
            <h2>🔍 Уголовные дела</h2>
            <button class="btn btn-success" onclick="showCriminalCaseForm()">➕ Возбудить дело</button>
            
            <div id="criminalCaseFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Возбуждение'} уголовного дела</h3>
                <form onsubmit="saveCriminalCase(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Номер дела:</label>
                            <input type="text" id="caseNumber" required placeholder="Например: 12345">
                        </div>
                        <div class="form-group">
                            <label>Статья УК:</label>
                            <input type="text" id="caseArticle" required placeholder="Например: 158 УК РФ">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Подозреваемые/Обвиняемые:</label>
                        <textarea id="caseSuspects" rows="2" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Обстоятельства:</label>
                        <textarea id="caseCircumstances" rows="3" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Следователь:</label>
                            <input type="text" id="caseInvestigator" value="${currentUser.fullName}" readonly>
                        </div>
                        <div class="form-group">
                            <label>Дата возбуждения:</label>
                            <input type="date" id="caseStartDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Статус:</label>
                        <select id="caseStatus">
                            <option value="Возбуждено">Возбуждено</option>
                            <option value="Расследование">Расследование</option>
                            <option value="Приостановлено">Приостановлено</option>
                            <option value="Передано в суд">Передано в суд</option>
                            <option value="Закрыто">Закрыто</option>
                        </select>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить дело'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideCriminalCaseForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="criminalCasesTableContainer"></div>
        </div>
    `;
}

function showCriminalCaseForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('criminalCaseFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('caseNumber').value = '';
        document.getElementById('caseArticle').value = '';
        document.getElementById('caseSuspects').value = '';
        document.getElementById('caseCircumstances').value = '';
        document.getElementById('caseStartDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('caseStatus').value = 'Возбуждено';
    }
}

function hideCriminalCaseForm() {
    const form = document.getElementById('criminalCaseFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveCriminalCase(event) {
    event.preventDefault();
    
    const criminalCase = {
        id: editingId || Date.now(),
        number: document.getElementById('caseNumber').value,
        article: document.getElementById('caseArticle').value,
        suspects: document.getElementById('caseSuspects').value,
        circumstances: document.getElementById('caseCircumstances').value,
        investigator: document.getElementById('caseInvestigator').value,
        startDate: document.getElementById('caseStartDate').value,
        status: document.getElementById('caseStatus').value,
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.criminalCases.findIndex(c => c.id === editingId);
        if (index !== -1) {
            systemData.criminalCases[index] = criminalCase;
        }
    } else {
        systemData.criminalCases.push(criminalCase);
    }
    
    if (saveAllData()) {
        showNotification('✅ Уголовное дело сохранено', 'success');
    }
    loadCriminalCasesTable();
    hideCriminalCaseForm();
}

function editCriminalCase(id) {
    const criminalCase = systemData.criminalCases.find(c => c.id === id);
    if (criminalCase) {
        editingId = id;
        const form = document.getElementById('criminalCaseFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('caseNumber').value = criminalCase.number;
            document.getElementById('caseArticle').value = criminalCase.article;
            document.getElementById('caseSuspects').value = criminalCase.suspects;
            document.getElementById('caseCircumstances').value = criminalCase.circumstances;
            document.getElementById('caseInvestigator').value = criminalCase.investigator;
            document.getElementById('caseStartDate').value = criminalCase.startDate;
            document.getElementById('caseStatus').value = criminalCase.status;
        }
    }
}

function loadCriminalCasesTable() {
    const container = document.getElementById('criminalCasesTableContainer');
    if (!container) return;
    
    if (systemData.criminalCases.length === 0) {
        container.innerHTML = '<div class="loading">Нет уголовных дел</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>№ дела</th>
                    <th>Статья</th>
                    <th>Подозреваемые</th>
                    <th>Следователь</th>
                    <th>Дата возбуждения</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.criminalCases.map(caseItem => `
                    <tr>
                        <td>${caseItem.number}</td>
                        <td>${caseItem.article}</td>
                        <td>${caseItem.suspects.length > 30 ? caseItem.suspects.substring(0, 30) + '...' : caseItem.suspects}</td>
                        <td>${caseItem.investigator}</td>
                        <td>${caseItem.startDate}</td>
                        <td>${caseItem.status}</td>
                        <td>
                            <button class="btn" onclick="editCriminalCase(${caseItem.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteCriminalCase(${caseItem.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteCriminalCase(id) {
    if (confirm('Удалить уголовное дело?')) {
        systemData.criminalCases = systemData.criminalCases.filter(c => c.id !== id);
        if (saveAllData()) {
            showNotification('✅ Уголовное дело удалено', 'success');
        }
        loadCriminalCasesTable();
    }
}

// === МОДУЛЬ РОЗЫСКА ===
function getWantedModule() {
    return `
        <div class="module">
            <h2>🕵️ Розыск</h2>
            <button class="btn btn-success" onclick="showWantedForm()">➕ Объявить в розыск</button>
            
            <div id="wantedFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Объявление'} в розыск</h3>
                <form onsubmit="saveWantedRecord(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="wantedNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="wantedFullName" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Основание для розыска:</label>
                        <textarea id="wantedReason" rows="3" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Уровень розыска:</label>
                            <select id="wantedLevel" required>
                                <option value="Региональный">Региональный</option>
                                <option value="Федеральный">Федеральный</option>
                                <option value="Международный">Международный</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Дата объявления:</label>
                            <input type="date" id="wantedDate" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Инициатор розыска:</label>
                        <input type="text" id="wantedInitiator" value="${currentUser.fullName}" readonly>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Объявить в розыск'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideWantedForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div class="tabs">
                <div class="tab active" onclick="filterWanted('all')">Все</div>
                <div class="tab" onclick="filterWanted('Региональный')">Региональный</div>
                <div class="tab" onclick="filterWanted('Федеральный')">Федеральный</div>
                <div class="tab" onclick="filterWanted('Международный')">Международный</div>
            </div>
            
            <div id="wantedTableContainer"></div>
        </div>
    `;
}

function showWantedForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('wantedFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('wantedNickname').value = '';
        document.getElementById('wantedFullName').value = '';
        document.getElementById('wantedReason').value = '';
        document.getElementById('wantedLevel').value = 'Региональный';
        document.getElementById('wantedDate').value = new Date().toISOString().split('T')[0];
    }
}

function hideWantedForm() {
    const form = document.getElementById('wantedFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveWantedRecord(event) {
    event.preventDefault();
    
    const wanted = {
        id: editingId || Date.now(),
        nickname: document.getElementById('wantedNickname').value,
        fullName: document.getElementById('wantedFullName').value,
        reason: document.getElementById('wantedReason').value,
        level: document.getElementById('wantedLevel').value,
        date: document.getElementById('wantedDate').value,
        initiator: document.getElementById('wantedInitiator').value,
        status: 'В розыске',
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.wanted.findIndex(w => w.id === editingId);
        if (index !== -1) {
            systemData.wanted[index] = wanted;
        }
    } else {
        systemData.wanted.push(wanted);
    }
    
    if (saveAllData()) {
        showNotification('✅ Розыск объявлен', 'success');
    }
    loadWantedTable();
    hideWantedForm();
}

function editWanted(id) {
    const wanted = systemData.wanted.find(w => w.id === id);
    if (wanted) {
        editingId = id;
        const form = document.getElementById('wantedFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('wantedNickname').value = wanted.nickname;
            document.getElementById('wantedFullName').value = wanted.fullName;
            document.getElementById('wantedReason').value = wanted.reason;
            document.getElementById('wantedLevel').value = wanted.level;
            document.getElementById('wantedDate').value = wanted.date;
        }
    }
}

function filterWanted(level) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const container = document.getElementById('wantedTableContainer');
    const filtered = level === 'all' ? systemData.wanted : systemData.wanted.filter(w => w.level === level);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей розыска</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Основание</th>
                    <th>Уровень</th>
                    <th>Дата</th>
                    <th>Инициатор</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(wanted => `
                    <tr>
                        <td>${wanted.nickname}</td>
                        <td>${wanted.fullName}</td>
                        <td>${wanted.reason.length > 50 ? wanted.reason.substring(0, 50) + '...' : wanted.reason}</td>
                        <td><span style="color: ${
                            wanted.level === 'Международный' ? 'red' : 
                            wanted.level === 'Федеральный' ? 'orange' : 'blue'
                        }">${wanted.level}</span></td>
                        <td>${wanted.date}</td>
                        <td>${wanted.initiator}</td>
                        <td>${wanted.status}</td>
                        <td>
                            <button class="btn" onclick="editWanted(${wanted.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteWanted(${wanted.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadWantedTable() {
    const container = document.getElementById('wantedTableContainer');
    if (!container) return;
    
    if (systemData.wanted.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей розыска</div>';
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Основание</th>
                    <th>Уровень</th>
                    <th>Дата</th>
                    <th>Инициатор</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.wanted.map(wanted => `
                    <tr>
                        <td>${wanted.nickname}</td>
                        <td>${wanted.fullName}</td>
                        <td>${wanted.reason.length > 50 ? wanted.reason.substring(0, 50) + '...' : wanted.reason}</td>
                        <td><span style="color: ${
                            wanted.level === 'Международный' ? 'red' : 
                            wanted.level === 'Федеральный' ? 'orange' : 'blue'
                        }">${wanted.level}</span></td>
                        <td>${wanted.date}</td>
                        <td>${wanted.initiator}</td>
                        <td>${wanted.status}</td>
                        <td>
                            <button class="btn" onclick="editWanted(${wanted.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteWanted(${wanted.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteWanted(id) {
    if (confirm('Снять с розыска?')) {
        systemData.wanted = systemData.wanted.filter(w => w.id !== id);
        if (saveAllData()) {
            showNotification('✅ Розыск отменен', 'success');
        }
        loadWantedTable();
    }
}

// === МОДУЛЬ ГОСУДАРСТВЕННОЙ ТАЙНЫ ===
function getStateSecretModule() {
    const allowedPositions = ['Инспектор УСБ', 'Оперуполномоченный уголовного розыска', 'Следователь следственного отдела', 'Начальник территориального управления'];
    
    if (!allowedPositions.includes(currentUser.position)) {
        return `
            <div class="module state-secret">
                <h2>🔐 Государственная тайна</h2>
                <div style="text-align: center; padding: 50px;">
                    <h3 style="color: #e74c3c;">🚫 ДОСТУП ЗАПРЕЩЕН</h3>
                    <p>У вас недостаточно полномочий для доступа к этому разделу</p>
                    <p><strong>Требуемая должность:</strong> УСБ, Уголовный розыск, Следователь или Начальник</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="module state-secret">
            <h2>🔐 Государственная тайна</h2>
            <div class="tabs">
                <div class="tab active" onclick="showStateSecretTab('terroristOrgs')">Терр. организации</div>
                <div class="tab" onclick="showStateSecretTab('terrorists')">Террористы</div>
                <div class="tab" onclick="showStateSecretTab('extremists')">Экстремисты</div>
                <div class="tab" onclick="showStateSecretTab('unwanted')">Нежелательные лица</div>
                <div class="tab" onclick="showStateSecretTab('foreignAgents')">Иностранные агенты</div>
            </div>
            
            <div id="stateSecretContent">
                <div class="tab-content active" id="terroristOrgsTab">
                    <h3>🏴 Террористические организации</h3>
                    <div class="form-group">
                        <input type="text" id="newTerroristOrg" placeholder="Название организации">
                        <button class="btn" onclick="addTerroristOrg()">Добавить</button>
                    </div>
                    <div id="terroristOrgsList"></div>
                </div>
                
                <div class="tab-content" id="terroristsTab">
                    <h3>👤 Террористы</h3>
                    <div class="form-group">
                        <input type="text" id="newTerrorist" placeholder="ФИО террориста">
                        <button class="btn" onclick="addTerrorist()">Добавить</button>
                    </div>
                    <div id="terroristsList"></div>
                </div>
                
                <div class="tab-content" id="extremistsTab">
                    <h3>⚠️ Экстремисты</h3>
                    <div class="form-group">
                        <input type="text" id="newExtremist" placeholder="ФИО экстремиста">
                        <button class="btn" onclick="addExtremist()">Добавить</button>
                    </div>
                    <div id="extremistsList"></div>
                </div>
                
                <div class="tab-content" id="unwantedTab">
                    <h3>🚫 Нежелательные лица и организации</h3>
                    <div class="form-group">
                        <input type="text" id="newUnwanted" placeholder="ФИО или название организации">
                        <button class="btn" onclick="addUnwanted()">Добавить</button>
                    </div>
                    <div id="unwantedList"></div>
                </div>
                
                <div class="tab-content" id="foreignAgentsTab">
                    <h3>🌍 Иностранные агенты</h3>
                    <div class="form-group">
                        <input type="text" id="newForeignAgent" placeholder="ФИО агента">
                        <button class="btn" onclick="addForeignAgent()">Добавить</button>
                    </div>
                    <div id="foreignAgentsList"></div>
                </div>
            </div>
        </div>
    `;
}

function showStateSecretTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    loadStateSecretData();
}

function addTerroristOrg() {
    const name = document.getElementById('newTerroristOrg').value;
    if (name) {
        systemData.stateSecret.terroristOrgs.push({
            id: Date.now(),
            name: name,
            addedBy: currentUser.nickname,
            date: new Date().toLocaleString()
        });
        saveAllData();
        loadStateSecretData();
        document.getElementById('newTerroristOrg').value = '';
        showNotification('✅ Террористическая организация добавлена', 'success');
    }
}

function addTerrorist() {
    const name = document.getElementById('newTerrorist').value;
    if (name) {
        systemData.stateSecret.terrorists.push({
            id: Date.now(),
            name: name,
            addedBy: currentUser.nickname,
            date: new Date().toLocaleString()
        });
        saveAllData();
        loadStateSecretData();
        document.getElementById('newTerrorist').value = '';
        showNotification('✅ Террорист добавлен', 'success');
    }
}

function addExtremist() {
    const name = document.getElementById('newExtremist').value;
    if (name) {
        systemData.stateSecret.extremists.push({
            id: Date.now(),
            name: name,
            addedBy: currentUser.nickname,
            date: new Date().toLocaleString()
        });
        saveAllData();
        loadStateSecretData();
        document.getElementById('newExtremist').value = '';
        showNotification('✅ Экстремист добавлен', 'success');
    }
}

function addUnwanted() {
    const name = document.getElementById('newUnwanted').value;
    if (name) {
        systemData.stateSecret.unwanted.push({
            id: Date.now(),
            name: name,
            addedBy: currentUser.nickname,
            date: new Date().toLocaleString()
        });
        saveAllData();
        loadStateSecretData();
        document.getElementById('newUnwanted').value = '';
        showNotification('✅ Нежелательное лицо добавлено', 'success');
    }
}

function addForeignAgent() {
    const name = document.getElementById('newForeignAgent').value;
    if (name) {
        systemData.stateSecret.foreignAgents.push({
            id: Date.now(),
            name: name,
            addedBy: currentUser.nickname,
            date: new Date().toLocaleString()
        });
        saveAllData();
        loadStateSecretData();
        document.getElementById('newForeignAgent').value = '';
        showNotification('✅ Иностранный агент добавлен', 'success');
    }
}

function loadStateSecretData() {
    // Террористические организации
    if (document.getElementById('terroristOrgsList')) {
        document.getElementById('terroristOrgsList').innerHTML = 
            systemData.stateSecret.terroristOrgs.map(org => 
                `<div style="padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${org.name}</strong>
                        <div style="font-size: 12px; color: #ccc;">Добавил: ${org.addedBy} | ${org.date}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteStateSecretItem('terroristOrgs', ${org.id})">🗑️</button>
                </div>`
            ).join('') || '<div style="padding: 8px; color: #ccc;">Нет записей</div>';
    }
    
    // Террористы
    if (document.getElementById('terroristsList')) {
        document.getElementById('terroristsList').innerHTML = 
            systemData.stateSecret.terrorists.map(terrorist => 
                `<div style="padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${terrorist.name}</strong>
                        <div style="font-size: 12px; color: #ccc;">Добавил: ${terrorist.addedBy} | ${terrorist.date}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteStateSecretItem('terrorists', ${terrorist.id})">🗑️</button>
                </div>`
            ).join('') || '<div style="padding: 8px; color: #ccc;">Нет записей</div>';
    }
    
    // Экстремисты
    if (document.getElementById('extremistsList')) {
        document.getElementById('extremistsList').innerHTML = 
            systemData.stateSecret.extremists.map(extremist => 
                `<div style="padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${extremist.name}</strong>
                        <div style="font-size: 12px; color: #ccc;">Добавил: ${extremist.addedBy} | ${extremist.date}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteStateSecretItem('extremists', ${extremist.id})">🗑️</button>
                </div>`
            ).join('') || '<div style="padding: 8px; color: #ccc;">Нет записей</div>';
    }
    
    // Нежелательные лица
    if (document.getElementById('unwantedList')) {
        document.getElementById('unwantedList').innerHTML = 
            systemData.stateSecret.unwanted.map(item => 
                `<div style="padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${item.name}</strong>
                        <div style="font-size: 12px; color: #ccc;">Добавил: ${item.addedBy} | ${item.date}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteStateSecretItem('unwanted', ${item.id})">🗑️</button>
                </div>`
            ).join('') || '<div style="padding: 8px; color: #ccc;">Нет записей</div>';
    }
    
    // Иностранные агенты
    if (document.getElementById('foreignAgentsList')) {
        document.getElementById('foreignAgentsList').innerHTML = 
            systemData.stateSecret.foreignAgents.map(agent => 
                `<div style="padding: 8px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${agent.name}</strong>
                        <div style="font-size: 12px; color: #ccc;">Добавил: ${agent.addedBy} | ${agent.date}</div>
                    </div>
                    <button class="btn btn-danger" style="padding: 2px 8px; font-size: 12px;" onclick="deleteStateSecretItem('foreignAgents', ${agent.id})">🗑️</button>
                </div>`
            ).join('') || '<div style="padding: 8px; color: #ccc;">Нет записей</div>';
    }
}

function deleteStateSecretItem(type, id) {
    if (confirm('Удалить запись из государственной тайны?')) {
        systemData.stateSecret[type] = systemData.stateSecret[type].filter(item => item.id !== id);
        if (saveAllData()) {
            showNotification('✅ Запись удалена из государственной тайны', 'success');
        }
        loadStateSecretData();
    }
}

// === МОДУЛЬ БАЗЫ ДОЛЖНИКОВ ===
function getDebtorsModule() {
    return `
        <div class="module">
            <h2>💳 База должников</h2>
            <button class="btn btn-success" onclick="showDebtorForm()">➕ Добавить должника</button>
            
            <div id="debtorFormContainer" style="display: none; margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
                <h3>${editingId ? 'Редактирование' : 'Добавление'} должника</h3>
                <form onsubmit="saveDebtor(event)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Никнейм:</label>
                            <input type="text" id="debtorNickname" required>
                        </div>
                        <div class="form-group">
                            <label>ФИО:</label>
                            <input type="text" id="debtorFullName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Тип долга:</label>
                            <select id="debtType" required>
                                <option value="Административный штраф">Административный штраф</option>
                                <option value="Налоги">Налоги</option>
                                <option value="Алименты">Алименты</option>
                                <option value="Кредит">Кредит</option>
                                <option value="Иное">Иное</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Сумма долга:</label>
                            <input type="number" id="debtAmount" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Причина/Основание:</label>
                        <textarea id="debtReason" rows="2" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Дата возникновения:</label>
                        <input type="date" id="debtDate" required>
                    </div>
                    <div class="form-buttons">
                        <button type="submit" class="btn btn-success">${editingId ? 'Обновить' : 'Сохранить'}</button>
                        <button type="button" class="btn btn-danger" onclick="hideDebtorForm()">Отмена</button>
                    </div>
                </form>
            </div>
            
            <div id="debtorsTableContainer"></div>
        </div>
    `;
}

function showDebtorForm() {
    hideAllForms();
    editingId = null;
    const form = document.getElementById('debtorFormContainer');
    if (form) {
        form.style.display = 'block';
        document.getElementById('debtorNickname').value = '';
        document.getElementById('debtorFullName').value = '';
        document.getElementById('debtType').value = 'Административный штраф';
        document.getElementById('debtAmount').value = '';
        document.getElementById('debtReason').value = '';
        document.getElementById('debtDate').value = new Date().toISOString().split('T')[0];
    }
}

function hideDebtorForm() {
    const form = document.getElementById('debtorFormContainer');
    if (form) form.style.display = 'none';
    editingId = null;
}

function saveDebtor(event) {
    event.preventDefault();
    
    const debtor = {
        id: editingId || Date.now(),
        nickname: document.getElementById('debtorNickname').value,
        fullName: document.getElementById('debtorFullName').value,
        debtType: document.getElementById('debtType').value,
        debtAmount: document.getElementById('debtAmount').value,
        debtReason: document.getElementById('debtReason').value,
        debtDate: document.getElementById('debtDate').value,
        status: 'Не погашен',
        createdBy: currentUser.nickname,
        createdAt: new Date().toLocaleString()
    };
    
    if (editingId) {
        const index = systemData.debtors.findIndex(d => d.id === editingId);
        if (index !== -1) {
            systemData.debtors[index] = debtor;
        }
    } else {
        systemData.debtors.push(debtor);
    }
    
    if (saveAllData()) {
        showNotification('✅ Должник сохранен', 'success');
    }
    loadDebtorsTable();
    hideDebtorForm();
}

function editDebtor(id) {
    const debtor = systemData.debtors.find(d => d.id === id);
    if (debtor) {
        editingId = id;
        const form = document.getElementById('debtorFormContainer');
        if (form) {
            form.style.display = 'block';
            document.getElementById('debtorNickname').value = debtor.nickname;
            document.getElementById('debtorFullName').value = debtor.fullName;
            document.getElementById('debtType').value = debtor.debtType;
            document.getElementById('debtAmount').value = debtor.debtAmount;
            document.getElementById('debtReason').value = debtor.debtReason;
            document.getElementById('debtDate').value = debtor.debtDate;
        }
    }
}

function loadDebtorsTable() {
    const container = document.getElementById('debtorsTableContainer');
    if (!container) return;
    
    if (systemData.debtors.length === 0) {
        container.innerHTML = '<div class="loading">Нет данных о должниках</div>';
        return;
    }
    
    const totalDebt = systemData.debtors.reduce((sum, debtor) => sum + parseFloat(debtor.debtAmount || 0), 0);
    
    container.innerHTML = `
        <div style="margin-bottom: 15px; padding: 10px; background: #e74c3c; color: white; border-radius: 5px;">
            <strong>Общая сумма задолженности: ${totalDebt.toLocaleString()} руб.</strong>
        </div>
        <table class="table">
            <thead>
                <tr>
                    <th>Никнейм</th>
                    <th>ФИО</th>
                    <th>Тип долга</th>
                    <th>Сумма</th>
                    <th>Причина</th>
                    <th>Дата</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${systemData.debtors.map(debtor => `
                    <tr>
                        <td>${debtor.nickname}</td>
                        <td>${debtor.fullName}</td>
                        <td>${debtor.debtType}</td>
                        <td>${parseFloat(debtor.debtAmount).toLocaleString()} руб.</td>
                        <td>${debtor.debtReason}</td>
                        <td>${debtor.debtDate}</td>
                        <td>${debtor.status}</td>
                        <td>
                            <button class="btn" onclick="editDebtor(${debtor.id})">✏️</button>
                            <button class="btn btn-danger" onclick="deleteDebtor(${debtor.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function deleteDebtor(id) {
    if (confirm('Удалить должника из базы?')) {
        systemData.debtors = systemData.debtors.filter(d => d.id !== id);
        if (saveAllData()) {
            showNotification('✅ Должник удален', 'success');
        }
        loadDebtorsTable();
    }
}

// === МОДУЛЬ ОПЕРАТИВНОГО ЖУРНАЛА ===
function getJournalModule() {
    return `
        <div class="module">
            <h2>📓 Оперативный журнал</h2>
            
            <div class="cards-grid">
                <div class="card">
                    <h3>🛡️ Заступление на службу</h3>
                    <div class="form-group">
                        <label>Дата/время заступления:</label>
                        <input type="datetime-local" id="journalDutyStart">
                    </div>
                    <div class="form-group">
                        <label>Смена:</label>
                        <select id="journalShift">
                            <option value="Дневная">Дневная</option>
                            <option value="Вечерняя">Вечерняя</option>
                            <option value="Ночная">Ночная</option>
                        </select>
                    </div>
                    <button class="btn btn-success" onclick="addJournalEntry('duty_start')">Заступить на службу</button>
                </div>
                
                <div class="card">
                    <h3>🎽 Получение экипировки</h3>
                    <div class="form-group">
                        <label>Тип экипировки:</label>
                        <select id="journalEquipmentType">
                            <option value="Бронежилет">Бронежилет</option>
                            <option value="Дубинка">Дубинка</option>
                            <option value="Рация">Рация</option>
                            <option value="Транспортное средство">Транспортное средство</option>
                            <option value="Оружие">Оружие</option>
                            <option value="Спецсредства">Спецсредства</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Номер/Модель:</label>
                        <input type="text" id="journalEquipmentNumber">
                    </div>
                    <button class="btn btn-success" onclick="addJournalEntry('equipment_receive')">Получить экипировку</button>
                </div>
                
                <div class="card">
                    <h3>📝 Рапорт</h3>
                    <div class="form-group">
                        <label>Тип рапорта:</label>
                        <select id="journalReportType">
                            <option value="Патрулирование">Патрулирование</option>
                            <option value="Происшествие">Происшествие</option>
                            <option value="Выполнение задания">Выполнение задания</option>
                            <option value="Иное">Иное</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Содержание:</label>
                        <textarea id="journalReportContent" rows="3"></textarea>
                    </div>
                    <button class="btn btn-success" onclick="addJournalEntry('report')">Добавить рапорт</button>
                </div>
            </div>
            
            <div id="journalEntriesContainer" style="margin-top: 30px;">
                <h3>История записей</h3>
                <div id="journalTableContainer"></div>
            </div>
        </div>
    `;
}

function addJournalEntry(type) {
    let entry = {
        id: Date.now(),
        type: type,
        officer: currentUser.fullName,
        date: new Date().toLocaleString(),
        createdBy: currentUser.nickname
    };
    
    switch(type) {
        case 'duty_start':
            entry.shift = document.getElementById('journalShift').value;
            entry.startTime = document.getElementById('journalDutyStart').value;
            entry.content = `Заступил на службу (${entry.shift} смена)`;
            break;
            
        case 'equipment_receive':
            entry.equipmentType = document.getElementById('journalEquipmentType').value;
            entry.equipmentNumber = document.getElementById('journalEquipmentNumber').value;
            entry.content = `Получена экипировка: ${entry.equipmentType} ${entry.equipmentNumber ? '(' + entry.equipmentNumber + ')' : ''}`;
            break;
            
        case 'report':
            entry.reportType = document.getElementById('journalReportType').value;
            entry.content = document.getElementById('journalReportContent').value;
            entry.fullContent = `Рапорт (${entry.reportType}): ${entry.content}`;
            break;
    }
    
    systemData.journal.push(entry);
    if (saveAllData()) {
        showNotification('✅ Запись журнала добавлена', 'success');
    }
    loadJournalEntries();
    
    // Очистка форм
    if (type === 'equipment_receive') {
        document.getElementById('journalEquipmentNumber').value = '';
    }
    if (type === 'report') {
        document.getElementById('journalReportContent').value = '';
    }
}

function loadJournalEntries() {
    const container = document.getElementById('journalTableContainer');
    if (!container) return;
    
    if (systemData.journal.length === 0) {
        container.innerHTML = '<div class="loading">Нет записей в журнале</div>';
        return;
    }
    
    const recentEntries = systemData.journal.slice(-50).reverse();
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Дата/время</th>
                    <th>Сотрудник</th>
                    <th>Тип записи</th>
                    <th>Содержание</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${recentEntries.map(entry => `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.officer}</td>
                        <td>${getJournalTypeLabel(entry.type)}</td>
                        <td>${entry.content || entry.fullContent || '-'}</td>
                        <td>
                            <button class="btn btn-danger" onclick="deleteJournalEntry(${entry.id})">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getJournalTypeLabel(type) {
    const labels = {
        'duty_start': '🛡️ Заступление',
        'equipment_receive': '🎽 Экипировка', 
        'report': '📝 Рапорт'
    };
    return labels[type] || type;
}

function deleteJournalEntry(id) {
    if (confirm('Удалить эту запись из журнала?')) {
        systemData.journal = systemData.journal.filter(j => j.id !== id);
        if (saveAllData()) {
            showNotification('✅ Запись журнала удалена', 'success');
        }
        loadJournalEntries();
    }
}

// === МОДУЛЬ НОВОСТЕЙ ===
function getNewsModule() {
    const canPublish = ['Начальник территориального управления', 'Иное допущенное лицо'].includes(currentUser.position);
    
    return `
        <div class="module">
            <h2>📰 Новости</h2>
            
            ${canPublish ? `
            <div class="card" style="margin-bottom: 20px;">
                <h3>Опубликовать новость</h3>
                <div class="form-group">
                    <label>Заголовок:</label>
                    <input type="text" id="newsTitle" placeholder="Введите заголовок новости">
                </div>
                <div class="form-group">
                    <label>Содержание:</label>
                    <textarea id="newsContent" rows="4" placeholder="Текст новости..."></textarea>
                </div>
                <button class="btn btn-success" onclick="publishNews()">Опубликовать</button>
            </div>
            ` : ''}
            
            <div id="newsContainer">
                ${systemData.news.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #666;">
                        <h3>Новостей пока нет</h3>
                        <p>Будьте первым, кто опубликует важную информацию!</p>
                    </div>
                ` : ''}
                ${systemData.news.slice().reverse().map(news => `
                    <div class="card" style="margin-bottom: 15px;">
                        <h3>${news.title}</h3>
                        <p>${news.content}</p>
                        <div style="font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
                            Опубликовал: ${news.author} | ${news.date}
                            ${news.createdBy === currentUser.nickname ? 
                                `<button class="btn btn-danger" style="float: right; padding: 2px 8px; font-size: 12px;" onclick="deleteNews(${news.id})">Удалить</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function publishNews() {
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    
    if (!title || !content) {
        alert('Заполните заголовок и содержание новости!');
        return;
    }
    
    const news = {
        id: Date.now(),
        title: title,
        content: content,
        author: currentUser.fullName,
        date: new Date().toLocaleString(),
        createdBy: currentUser.nickname
    };
    
    systemData.news.push(news);
    if (saveAllData()) {
        showNotification('✅ Новость опубликована', 'success');
    }
    
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    showModule('news');
}

function deleteNews(id) {
    if (confirm('Удалить эту новость?')) {
        systemData.news = systemData.news.filter(n => n.id !== id);
        if (saveAllData()) {
            showNotification('✅ Новость удалена', 'success');
        }
        showModule('news');
    }
}

function loadNews() {
    // Автоматически вызывается при показе модуля
}

// === МОДУЛЬ МИНИ-ИГР ===
function getGamesModule() {
    return `
        <div class="module">
            <h2>🎮 Криминалистика и мини-игры</h2>
            
            <div class="cards-grid">
                <div class="card">
                    <h3>🔍 Сравнение отпечатков</h3>
                    <p>Сравните отпечатки пальцев с базой данных</p>
                    <div class="form-group">
                        <label>Код отпечатка:</label>
                        <input type="text" id="fingerprintCode" placeholder="Введите код отпечатка">
                    </div>
                    <button class="btn" onclick="checkFingerprint()">Проверить</button>
                    <div id="fingerprintResult" style="margin-top: 10px;"></div>
                </div>
                
                <div class="card">
                    <h3>👤 Составление фоторобота</h3>
                    <p>Создайте фоторобот по описанию свидетеля</p>
                    <div class="form-group">
                        <label>Форма лица:</label>
                        <select id="faceShape">
                            <option value="круглое">Круглое</option>
                            <option value="овальное">Овальное</option>
                            <option value="квадратное">Квадратное</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Цвет волос:</label>
                        <select id="hairColor">
                            <option value="блондин">Блондин</option>
                            <option value="брюнет">Брюнет</option>
                            <option value="рыжий">Рыжий</option>
                            <option value="шатен">Шатен</option>
                        </select>
                    </div>
                    <button class="btn" onclick="generatePhotorobot()">Создать фоторобот</button>
                    <div id="photorobotResult" style="margin-top: 10px;"></div>
                </div>
                
                <div class="card">
                    <h3>🧩 Анализ улик</h3>
                    <p>Расшифруйте улики для раскрытия преступления</p>
                    <div id="evidencePuzzle">
                        <p><strong>Зашифрованное сообщение:</strong></p>
                        <p style="font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px;">
                            ${btoa('Подозреваемый был замечен в районе центрального рынка')}
                        </p>
                        <div class="form-group">
                            <label>Расшифровка:</label>
                            <input type="text" id="evidenceDecode" placeholder="Введите расшифровку">
                        </div>
                        <button class="btn" onclick="checkEvidence()">Проверить</button>
                        <div id="evidenceResult" style="margin-top: 10px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function checkFingerprint() {
    const code = document.getElementById('fingerprintCode').value;
    const resultDiv = document.getElementById('fingerprintResult');
    
    if (!code) {
        resultDiv.innerHTML = '<span style="color: red;">Введите код отпечатка</span>';
        return;
    }
    
    const matches = systemData.citizens.filter(c => 
        c.nickname.toLowerCase().includes(code.toLowerCase()) || 
        c.fullName.toLowerCase().includes(code.toLowerCase())
    ).slice(0, 3);
    
    if (matches.length > 0) {
        resultDiv.innerHTML = `
            <span style="color: green;">✅ Найдены совпадения:</span>
            <ul style="margin-top: 5px;">
                ${matches.map(m => `<li>${m.nickname} - ${m.fullName}</li>`).join('')}
            </ul>
        `;
    } else {
        resultDiv.innerHTML = '<span style="color: red;">❌ Совпадений не найдено</span>';
    }
}

function generatePhotorobot() {
    const faceShape = document.getElementById('faceShape').value;
    const hairColor = document.getElementById('hairColor').value;
    const resultDiv = document.getElementById('photorobotResult');
    
    const descriptions = {
        'круглое': '🟡',
        'овальное': '🥚', 
        'квадратное': '◼️'
    };
    
    const colors = {
        'блондин': '🟡',
        'брюнет': '⚫',
        'рыжий': '🔴',
        'шатен': '🟤'
    };
    
    resultDiv.innerHTML = `
        <div style="text-align: center; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <h4>Фоторобот создан!</h4>
            <div style="font-size: 40px; margin: 10px 0;">👤</div>
            <p><strong>Форма лица:</strong> ${faceShape} ${descriptions[faceShape]}</p>
            <p><strong>Цвет волос:</strong> ${hairColor} ${colors[hairColor]}</p>
            <p style="color: green; margin-top: 10px;">✅ Фоторобот добавлен в базу данных</p>
        </div>
    `;
}

function checkEvidence() {
    const decode = document.getElementById('evidenceDecode').value;
    const resultDiv = document.getElementById('evidenceResult');
    const correctAnswer = 'Подозреваемый был замечен в районе центрального рынка';
    
    if (decode === correctAnswer) {
        resultDiv.innerHTML = '<span style="color: green;">✅ Правильно! Улика расшифрована.</span>';
    } else {
        resultDiv.innerHTML = '<span style="color: red;">❌ Неверно. Попробуйте еще раз.</span>';
    }
}

// === ГЛАВНАЯ ПАНЕЛЬ ===
function getDashboardModule() {
    const stats = {
        totalCitizens: systemData.citizens.length,
        totalDrivers: systemData.drivers.length,
        totalWanted: systemData.wanted.length,
        totalCriminalCases: systemData.criminalCases.length,
        totalDebt: systemData.debtors.reduce((sum, d) => sum + parseFloat(d.debtAmount || 0), 0)
    };
    
    return `
        <div class="module">
            <h2>📊 Главная панель</h2>
            
            <div class="cards-grid">
                <div class="card">
                    <h3>👥 Граждане</h3>
                    <div style="font-size: 2em; color: #3498db;">${stats.totalCitizens}</div>
                    <p>записей в базе</p>
                </div>
                
                <div class="card">
                    <h3>🚗 Водители</h3>
                    <div style="font-size: 2em; color: #e74c3c;">${stats.totalDrivers}</div>
                    <p>водительских удостоверений</p>
                </div>
                
                <div class="card">
                    <h3>🕵️ Розыск</h3>
                    <div style="font-size: 2em; color: #f39c12;">${stats.totalWanted}</div>
                    <p>разыскиваемых лиц</p>
                </div>
                
                <div class="card">
                    <h3>🔍 Уголовные дела</h3>
                    <div style="font-size: 2em; color: #9b59b6;">${stats.totalCriminalCases}</div>
                    <p>возбужденных дел</p>
                </div>
                
                <div class="card">
                    <h3>💳 Долги</h3>
                    <div style="font-size: 2em; color: #27ae60;">${stats.totalDebt.toLocaleString()}</div>
                    <p>рублей задолженности</p>
                </div>
                
                <div class="card">
                    <h3>👮 Ваш статус</h3>
                    <div style="font-size: 1.2em; color: #2c3e50;">${currentUser.position}</div>
                    <div style="font-size: 1em; color: #7f8c8d;">${currentUser.rank}</div>
                </div>
            </div>
            
            <div style="margin-top: 30px;">
                <h3>📈 Последняя активность</h3>
                <div class="card">
                    <p><strong>Последние добавленные граждане:</strong></p>
                    <ul>
                        ${systemData.citizens.slice(-3).reverse().map(c => 
                            `<li>${c.nickname} - ${c.fullName} (${new Date(c.createdAt).toLocaleDateString()})</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `;
}

// Добавляем тестовые данные при первом запуске
function addTestData() {
    if (systemData.citizens.length === 0) {
        systemData.citizens = [{
            id: 1,
            nickname: "TestUser",
            fullName: "Тестовый Пользователь",
            birthDate: "1990-01-01",
            passportNumber: "1234567890",
            address: "Тестовый адрес",
            additionalInfo: "Тестовые данные для демонстрации",
            criminalRecord: false,
            createdBy: "system",
            createdAt: new Date().toLocaleString()
        }];
        saveAllData();
        showNotification('✅ Добавлены тестовые данные', 'success');
    }
}

// Вызываем через 5 секунд после загрузки
setTimeout(addTestData, 5000);
