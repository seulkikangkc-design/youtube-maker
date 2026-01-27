const API_BASE = '';
const authToken = localStorage.getItem('authToken');

if (!authToken) {
    window.location.href = '/';
}

axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

async function init() {
    try {
        const res = await axios.get(`${API_BASE}/auth/me`);
        if (res.data.user.role !== 'admin') {
            alert('관리자 권한이 필요합니다');
            window.location.href = '/';
            return;
        }
        loadAdminPanel();
    } catch (error) {
        window.location.href = '/';
    }
}

async function loadAdminPanel() {
    try {
        const res = await axios.get(`${API_BASE}/admin/users`);
        const users = res.data.users;
        
        document.getElementById('app').innerHTML = `
            <div class="max-w-7xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-center">
                        <h1 class="text-3xl font-bold text-gray-800">
                            <i class="fas fa-shield-alt mr-2 text-red-600"></i>
                            관리자 패널
                        </h1>
                        <a href="/" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            <i class="fas fa-arrow-left mr-2"></i>대시보드
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">사용자 관리</h2>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">크레딧</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">영상 수</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${users.map(u => `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">${u.id}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">${u.email}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="px-2 py-1 rounded ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                                                ${u.role}
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">${u.credits}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">${u.videos_created}/10</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">${new Date(u.created_at).toLocaleDateString('ko-KR')}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <button onclick="adjustCredits(${u.id}, '${u.email}')" 
                                                class="text-blue-600 hover:text-blue-800 mr-3">
                                                <i class="fas fa-coins"></i>
                                            </button>
                                            <button onclick="toggleRole(${u.id}, '${u.role}')"
                                                class="text-purple-600 hover:text-purple-800">
                                                <i class="fas fa-user-shield"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        alert('데이터 로드 실패');
    }
}

async function adjustCredits(userId, email) {
    const amount = prompt(`${email}의 크레딧을 조정하세요 (양수: 추가, 음수: 차감):`);
    if (!amount) return;
    
    const reason = prompt('사유를 입력하세요:');
    if (!reason) return;
    
    try {
        await axios.post(`${API_BASE}/admin/credits/update`, {
            userId,
            amount: parseInt(amount),
            reason
        });
        alert('크레딧이 조정되었습니다');
        loadAdminPanel();
    } catch (error) {
        alert(error.response?.data?.error || '실패');
    }
}

async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`역할을 ${newRole}로 변경하시겠습니까?`)) return;
    
    try {
        await axios.post(`${API_BASE}/admin/user/role`, {
            userId,
            role: newRole
        });
        alert('역할이 변경되었습니다');
        loadAdminPanel();
    } catch (error) {
        alert(error.response?.data?.error || '실패');
    }
}

init();
