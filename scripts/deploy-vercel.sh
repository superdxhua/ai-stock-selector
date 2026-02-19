#!/bin/bash
set -Eeuo pipefail

# ===========================================
# Vercel 部署脚本
# ===========================================
# 用途：快速将项目部署到 Vercel 平台
# 使用方法：bash scripts/deploy-vercel.sh
# ===========================================

echo "🚀 Vercel 部署助手"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}📋 检查依赖...${NC}"

    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ 未找到 Node.js，请先安装 Node.js${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js 已安装: $(node -v)${NC}"

    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ 未找到 pnpm，请先安装 pnpm${NC}"
        echo -e "${YELLOW}   安装命令: npm install -g pnpm${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ pnpm 已安装: $(pnpm -v)${NC}"

    # 检查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️  未找到 Vercel CLI${NC}"
        read -p "是否现在安装？(y/n): " install_vercel
        if [[ $install_vercel =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}📦 安装 Vercel CLI...${NC}"
            npm install -g vercel
        else
            echo -e "${RED}❌ 需要安装 Vercel CLI 才能继续${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ Vercel CLI 已安装: $(vercel --version)${NC}"

    echo ""
}

# 检查环境变量
check_env_vars() {
    echo -e "${BLUE}🔐 检查环境变量...${NC}"

    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}⚠️  未找到 .env.local 文件${NC}"
        echo -e "${YELLOW}   请根据 .env.example 创建环境变量配置${NC}"
        read -p "是否继续部署？（环境变量需要在 Vercel Dashboard 中配置）(y/n): " continue_deploy
        if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 找到 .env.local 文件${NC}"
        echo -e "${YELLOW}   注意：部署后请在 Vercel Dashboard 中配置环境变量${NC}"
    fi

    echo ""
}

# 登录 Vercel
login_vercel() {
    echo -e "${BLUE}🔐 登录 Vercel...${NC}"
    vercel login
    echo ""
}

# 选择部署环境
select_environment() {
    echo -e "${BLUE}🌍 选择部署环境:${NC}"
    echo "1) 预览环境 (Preview)"
    echo "2) 生产环境 (Production)"
    read -p "请选择 (1/2): " env_choice

    case $env_choice in
        1)
            DEPLOY_ENV="preview"
            DEPLOY_CMD="vercel"
            ;;
        2)
            DEPLOY_ENV="production"
            DEPLOY_CMD="vercel --prod"
            ;;
        *)
            echo -e "${RED}❌ 无效选择${NC}"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✅ 选择: ${DEPLOY_ENV}${NC}"
    echo ""
}

# 构建项目
build_project() {
    echo -e "${BLUE}🔨 构建项目...${NC}"
    pnpm install --prefer-frozen-lockfile --prefer-offline
    npx next build
    echo -e "${GREEN}✅ 构建完成${NC}"
    echo ""
}

# 部署到 Vercel
deploy_to_vercel() {
    echo -e "${BLUE}🚀 部署到 Vercel (${DEPLOY_ENV})...${NC}"
    echo ""

    if [[ $DEPLOY_ENV == "production" ]]; then
        read -p "确认要部署到生产环境？(y/n): " confirm_prod
        if [[ ! $confirm_prod =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⚠️  已取消部署${NC}"
            exit 0
        fi
    fi

    # 执行部署
    $DEPLOY_CMD

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 部署成功！${NC}"
        echo -e "${YELLOW}📌 请记得在 Vercel Dashboard 中配置以下环境变量:${NC}"
        echo "   - NEXT_PUBLIC_SUPABASE_URL"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
        echo "   - DOUBAO_API_KEY"
    else
        echo -e "${RED}❌ 部署失败${NC}"
        exit 1
    fi
}

# 显示后续步骤
show_next_steps() {
    echo ""
    echo -e "${BLUE}📋 后续步骤:${NC}"
    echo ""
    echo "1. 配置环境变量"
    echo "   访问 Vercel Dashboard > Settings > Environment Variables"
    echo "   添加以下变量："
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - DOUBAO_API_KEY"
    echo ""
    echo "2. 初始化数据库"
    echo "   在 Supabase SQL Editor 中执行 VERCEL_DEPLOYMENT.md 中的 SQL 脚本"
    echo ""
    echo "3. 测试部署"
    echo "   访问部署 URL 测试所有功能"
    echo ""
    echo "4. 配置自定义域名（可选）"
    echo "   在 Vercel Dashboard > Settings > Domains 中添加"
    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
}

# 主流程
main() {
    echo ""
    check_dependencies
    check_env_vars
    login_vercel
    select_environment
    build_project
    deploy_to_vercel
    show_next_steps
}

# 执行主流程
main
