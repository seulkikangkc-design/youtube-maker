// API base URL
const API_BASE = '';

// State management
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Axios setup
if (authToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

// Initialize app
async function init() {
    if (authToken) {
        try {
            const res = await axios.get(`${API_BASE}/auth/me`);
            currentUser = res.data.user;
            showDashboard();
        } catch (error) {
            localStorage.removeItem('authToken');
            authToken = null;
            showAuth();
        }
    } else {
        showAuth();
    }
}

// Show authentication page
function showAuth() {
    document.getElementById('app').innerHTML = `
        <div class="max-w-md mx-auto mt-20">
            <div class="bg-white rounded-2xl shadow-xl p-8">
                <div class="text-center mb-8">
                    <i class="fas fa-video text-5xl text-blue-600 mb-4"></i>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">Video Finder</h1>
                    <p class="text-gray-600">경쟁이 적은 영상 아이템을 찾아드립니다</p>
                </div>
                
                <div class="mb-6">
                    <div class="flex border-b border-gray-200">
                        <button onclick="showLoginForm()" id="loginTab" class="flex-1 py-3 text-center font-medium border-b-2 border-blue-600 text-blue-600">
                            로그인
                        </button>
                        <button onclick="showSignupForm()" id="signupTab" class="flex-1 py-3 text-center font-medium text-gray-500 hover:text-gray-700">
                            회원가입
                        </button>
                    </div>
                </div>
                
                <div id="authForm">
                    <!-- Login form will be inserted here -->
                </div>
            </div>
        </div>
    `;
    
    showLoginForm();
}

function showLoginForm() {
    document.getElementById('loginTab').className = 'flex-1 py-3 text-center font-medium border-b-2 border-blue-600 text-blue-600';
    document.getElementById('signupTab').className = 'flex-1 py-3 text-center font-medium text-gray-500 hover:text-gray-700';
    
    document.getElementById('authForm').innerHTML = `
        <form onsubmit="handleLogin(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="loginEmail" required 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
                <input type="password" id="loginPassword" required 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">
                로그인
            </button>
        </form>
        <div id="loginError" class="mt-4 text-red-600 text-sm text-center hidden"></div>
    `;
}

function showSignupForm() {
    document.getElementById('signupTab').className = 'flex-1 py-3 text-center font-medium border-b-2 border-blue-600 text-blue-600';
    document.getElementById('loginTab').className = 'flex-1 py-3 text-center font-medium text-gray-500 hover:text-gray-700';
    
    document.getElementById('authForm').innerHTML = `
        <form onsubmit="handleSignup(event)" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
                <input type="email" id="signupEmail" required 
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 (최소 6자)</label>
                <input type="password" id="signupPassword" required minlength="6"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div class="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <i class="fas fa-gift mr-2"></i>
                가입 시 <strong>1000 크레딧</strong> 무료 제공!
            </div>
            <button type="submit" class="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition">
                회원가입
            </button>
        </form>
        <div id="signupError" class="mt-4 text-red-600 text-sm text-center hidden"></div>
    `;
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        authToken = res.data.token;
        currentUser = res.data.user;
        localStorage.setItem('authToken', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        showDashboard();
    } catch (error) {
        errorDiv.textContent = error.response?.data?.error || '로그인 실패';
        errorDiv.classList.remove('hidden');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const errorDiv = document.getElementById('signupError');
    
    try {
        const res = await axios.post(`${API_BASE}/auth/signup`, { email, password });
        authToken = res.data.token;
        currentUser = res.data.user;
        localStorage.setItem('authToken', authToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        showDashboard();
    } catch (error) {
        errorDiv.textContent = error.response?.data?.error || '회원가입 실패';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    delete axios.defaults.headers.common['Authorization'];
    showAuth();
}

// Show dashboard
async function showDashboard() {
    try {
        const creditsRes = await axios.get(`${API_BASE}/api/credits`);
        const { credits, videosCreated, canCreateVideo } = creditsRes.data;
        
        const adminButton = currentUser.role === 'admin' 
            ? '<div class="mb-6"><a href="/admin" class="inline-block px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"><i class="fas fa-shield-alt mr-2"></i>관리자 페이지</a></div>'
            : '';
        
        document.getElementById('app').innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold text-gray-800 mb-2">
                                <i class="fas fa-video mr-2 text-blue-600"></i>
                                Video Finder Dashboard
                            </h1>
                            <p class="text-gray-600">${currentUser.email}</p>
                        </div>
                        <div class="text-right">
                            <div class="flex items-center gap-6 mb-2">
                                <div>
                                    <span class="text-sm text-gray-600">크레딧</span>
                                    <p class="text-2xl font-bold text-blue-600">
                                        <i class="fas fa-coins mr-1"></i>${credits}
                                    </p>
                                </div>
                                <div>
                                    <span class="text-sm text-gray-600">생성 영상</span>
                                    <p class="text-2xl font-bold text-purple-600">
                                        <i class="fas fa-film mr-1"></i>${videosCreated}/10
                                    </p>
                                </div>
                            </div>
                            <button onclick="logout()" class="text-sm text-gray-600 hover:text-red-600">
                                <i class="fas fa-sign-out-alt mr-1"></i>로그아웃
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Trending Keywords Section -->
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-gray-800">
                            <i class="fas fa-fire mr-2 text-orange-600"></i>
                            트렌드 키워드 추천
                        </h2>
                        <button onclick="loadTrendingKeywords()" id="refreshTrendBtn"
                            class="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm">
                            <i class="fas fa-sync-alt mr-2"></i>새로고침
                        </button>
                    </div>
                    <div id="trendingKeywords" class="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div class="col-span-full text-center py-4 text-gray-500">
                            <i class="fas fa-spinner fa-spin mr-2"></i>로딩 중...
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-search mr-2 text-blue-600"></i>
                        키워드 분석
                    </h2>
                    
                    <form onsubmit="analyzeKeyword(event)" class="mb-6">
                        <div class="flex gap-4">
                            <input type="text" id="keyword" required
                                placeholder="예: 무선 이어폰 추천"
                                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <button type="submit" id="analyzeBtn"
                                class="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
                                <i class="fas fa-search mr-2"></i>분석하기
                            </button>
                        </div>
                    </form>
                    
                    <div id="analysisResult" class="hidden">
                        <!-- Analysis results will be shown here -->
                    </div>
                </div>
                
                ${adminButton}
            </div>
        `;
        
        // Load trending keywords
        loadTrendingKeywords();
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// Load trending keywords
async function loadTrendingKeywords() {
    const container = document.getElementById('trendingKeywords');
    const refreshBtn = document.getElementById('refreshTrendBtn');
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>로딩 중';
    }
    
    try {
        const res = await axios.get(`${API_BASE}/api/trending?count=10`);
        const keywords = res.data.keywords;
        
        container.innerHTML = keywords.map(k => `
            <button onclick="selectKeyword('${k.keyword.replace(/'/g, "\\'")}')"
                class="px-4 py-3 bg-white rounded-lg hover:bg-purple-100 transition shadow-sm border border-purple-200 text-left">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-gray-800 text-sm">${k.keyword}</span>
                    ${k.source === 'trending' ? '<i class="fas fa-fire text-orange-500 text-xs"></i>' : '<i class="fas fa-lightbulb text-yellow-500 text-xs"></i>'}
                </div>
                <div class="text-xs text-gray-500">${k.category}</div>
            </button>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div class="col-span-full text-center text-red-600">트렌드 로딩 실패</div>';
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>새로고침';
        }
    }
}

function selectKeyword(keyword) {
    document.getElementById('keyword').value = keyword;
    document.getElementById('keyword').focus();
    document.getElementById('keyword').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

let currentAnalysis = null;

async function analyzeKeyword(event) {
    event.preventDefault();
    const keyword = document.getElementById('keyword').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultDiv = document.getElementById('analysisResult');
    
    console.log('🔍 Analyzing keyword:', keyword);
    
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
    resultDiv.classList.add('hidden');
    
    try {
        const res = await axios.post(`${API_BASE}/api/analyze`, { keyword });
        console.log('✅ Analysis response:', res.data);
        currentAnalysis = res.data;
        
        const { youtube, gemini } = res.data.analysis;
        
        console.log('YouTube data:', youtube);
        console.log('Gemini data:', gemini);
        
        const videoConcepts = gemini.worthCreating 
            ? `<div class="mb-4">
                <h4 class="font-bold text-gray-800 mb-2">💡 영상 콘셉트 아이디어:</h4>
                <ul class="space-y-2">
                    ${gemini.videoConcepts.map(c => `<li class="flex items-start"><i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i><span>${c}</span></li>`).join('')}
                </ul>
            </div>
            <div class="bg-white rounded-lg p-4 mb-4">
                <h4 class="font-bold text-gray-800 mb-2">🎬 Hook Line (첫 3초):</h4>
                <p class="text-lg text-blue-600 font-medium">"${gemini.hookLine}"</p>
            </div>`
            : '';
        
        // 미디어 생성 버튼 추가
        const mediaButtons = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <button onclick="generateImage()" id="generateImageBtn"
                    class="py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 transition shadow-lg">
                    <i class="fas fa-image mr-2"></i>
                    이미지 생성 (50 크레딧)
                </button>
                <button onclick="generateVideoMedia()" id="generateVideoBtn"
                    class="py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-indigo-600 transition shadow-lg">
                    <i class="fas fa-film mr-2"></i>
                    영상 생성 (200 크레딧)
                </button>
            </div>
        `;
        
        const createButton = gemini.worthCreating
            ? `<button onclick="createVideo()" id="createVideoBtn"
                class="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition shadow-lg">
                <i class="fas fa-video mr-2"></i>
                영상 로그 생성 (100 크레딧 차감)
            </button>`
            : '';
        
        resultDiv.innerHTML = `
            <div class="space-y-6">
                <div class="bg-red-50 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fab fa-youtube text-red-600 mr-2"></i>
                        YouTube 경쟁도 분석
                    </h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-white rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">총 검색 결과</p>
                            <p class="text-2xl font-bold text-gray-800">${youtube.totalResults.toLocaleString()}</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">평균 조회수</p>
                            <p class="text-2xl font-bold text-gray-800">${youtube.avgViews.toLocaleString()}</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">최근 30일 영상</p>
                            <p class="text-2xl font-bold text-gray-800">${youtube.recentVideos}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-${gemini.worthCreating ? 'green' : 'yellow'}-50 rounded-xl p-6">
                    <h3 class="text-xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-brain text-purple-600 mr-2"></i>
                        AI 분석 결과
                    </h3>
                    
                    <div class="mb-4">
                        <div class="flex items-center mb-2">
                            <span class="text-lg font-bold mr-2">추천 여부:</span>
                            <span class="px-4 py-2 rounded-lg font-bold ${gemini.worthCreating 
                                ? 'bg-green-600 text-white' 
                                : 'bg-yellow-600 text-white'}">
                                ${gemini.worthCreating ? '✅ 제작 추천' : '⚠️ 신중 검토'}
                            </span>
                        </div>
                        <p class="text-gray-700 leading-relaxed">${gemini.reasoning}</p>
                    </div>
                    
                    ${videoConcepts}
                </div>
                
                ${mediaButtons}
                ${createButton}
                
                <div id="mediaResult" class="hidden mt-6"></div>
            </div>
        `;
        
        resultDiv.classList.remove('hidden');
        console.log('✅ Results displayed successfully');
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        alert(error.response?.data?.error || '분석 실패');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-search mr-2"></i>분석하기';
    }
}

async function createVideo() {
    if (!currentAnalysis) return;
    
    const btn = document.getElementById('createVideoBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>영상 생성 중...';
    
    try {
        const res = await axios.post(`${API_BASE}/api/video/create`, {
            keyword: currentAnalysis.keyword,
            analysis: currentAnalysis.analysis
        });
        
        const video = res.data.video;
        
        // Show success message with video info
        alert(`${res.data.message}\n\n영상이 생성되었습니다!\n썸네일: ${video.thumbnailUrl}`);
        
        showDashboard(); // Refresh dashboard
        
    } catch (error) {
        alert(error.response?.data?.error || '영상 생성 실패');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-video mr-2"></i>영상 로그 생성 (100 크레딧 차감)';
    }
}

// Generate image using Gemini Imagen 3
async function generateImage() {
    if (!currentAnalysis) return;
    
    const btn = document.getElementById('generateImageBtn');
    const mediaResult = document.getElementById('mediaResult');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중...';
    
    try {
        const prompt = `Create a high-quality thumbnail image for a YouTube video about: ${currentAnalysis.keyword}. 
Style: Eye-catching, professional, with bold text overlay. Korean market appeal.`;
        
        console.log('🎨 Generating image with prompt:', prompt);
        
        const res = await axios.post(`${API_BASE}/api/media/image`, { prompt });
        
        console.log('✅ Image generated:', res.data);
        
        mediaResult.innerHTML = `
            <div class="bg-white rounded-xl p-6 shadow-lg">
                <h4 class="font-bold text-gray-800 mb-4">
                    <i class="fas fa-image text-pink-600 mr-2"></i>생성된 이미지
                </h4>
                <img src="${res.data.image.imageUrl}" class="w-full rounded-lg shadow-md" alt="Generated Image">
                <p class="text-sm text-gray-600 mt-4">크레딧 차감: ${res.data.creditsDeducted}</p>
            </div>
        `;
        mediaResult.classList.remove('hidden');
        
        // Refresh credits
        await updateCredits();
        
    } catch (error) {
        console.error('❌ Image generation error:', error);
        alert(error.response?.data?.error || '이미지 생성 실패');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-image mr-2"></i>이미지 생성 (50 크레딧)';
    }
}

// Generate video using Gemini Veo 2
async function generateVideoMedia() {
    if (!currentAnalysis) return;
    
    const btn = document.getElementById('generateVideoBtn');
    const mediaResult = document.getElementById('mediaResult');
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중 (30-60초)...';
    
    try {
        const { gemini } = currentAnalysis.analysis;
        const prompt = `Create a 5-second vertical video (9:16) for YouTube Shorts about: ${currentAnalysis.keyword}.
Hook: ${gemini.hookLine}
Style: Dynamic, attention-grabbing, professional quality.`;
        
        console.log('🎬 Generating video with prompt:', prompt);
        
        const res = await axios.post(`${API_BASE}/api/media/video`, { prompt });
        
        console.log('✅ Video generated:', res.data);
        
        mediaResult.innerHTML = `
            <div class="bg-white rounded-xl p-6 shadow-lg">
                <h4 class="font-bold text-gray-800 mb-4">
                    <i class="fas fa-film text-purple-600 mr-2"></i>생성된 영상
                </h4>
                <video src="${res.data.video.videoUrl}" controls class="w-full rounded-lg shadow-md" style="max-height: 500px;"></video>
                <p class="text-sm text-gray-600 mt-4">크레딧 차감: ${res.data.creditsDeducted}</p>
            </div>
        `;
        mediaResult.classList.remove('hidden');
        
        // Refresh credits
        await updateCredits();
        
    } catch (error) {
        console.error('❌ Video generation error:', error);
        alert(error.response?.data?.error || '영상 생성 실패');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-film mr-2"></i>영상 생성 (200 크레딧)';
    }
}

// Initialize app
init();
