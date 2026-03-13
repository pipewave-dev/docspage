#!/bin/bash

# ==========================================
# 1. Đổi tên file và thư mục
# ==========================================
rename_items() {
    local search=$1
    local replace=$2
    
    # Dùng find với -depth để xử lý từ cấp con sâu nhất lên trên, 
    # tránh lỗi không tìm thấy file nếu thư mục cha bị đổi tên trước.
    # Bỏ qua thư mục .git, node_modules và file .sh để giữ an toàn.
    find . -depth -name "*${search}*" ! -path '*/\.git/*' ! -path '*/node_modules/*' ! -path '*/\.node_modules/*' ! -name '*.sh' | while read -r path; do
        dir=$(dirname "$path")
        base=$(basename "$path")
        
        # Thay thế chuỗi đích
        newbase=${base//"$search"/"$replace"}
        
        if [ "$base" != "$newbase" ]; then
            mv "$path" "$dir/$newbase"
            echo "[Đổi tên] $path -> $dir/$newbase"
        fi
    done
}

echo "=== BẮT ĐẦU ĐỔI TÊN TỆP VÀ THƯ MỤC ==="
rename_items "Echowave" "Pipewave"
rename_items "echowave" "pipewave"
rename_items "echo-wave" "pipewave"
rename_items "Echo-wave" "Pipewave"
rename_items "EchoWave" "Pipewave"
echo ""

# ==========================================
# 2. Đổi nội dung file
# ==========================================
replace_contents() {
    local search=$1
    local replace=$2
    echo "Đang thay thế nội dung: '$search' -> '$replace'..."
    
    # Tìm tất cả file (chỉ tính file văn bản với grep -I, bỏ qua các thư mục .git, node_modules và file .sh)
    find . -type f ! -path '*/\.git/*' ! -path '*/node_modules/*' ! -path '*/\.node_modules/*' ! -name '*.sh' -exec grep -Il "$search" {} + 2>/dev/null | while IFS= read -r file; do
        # Dùng perl thực hiện replace vì MacOS sed -i có cú pháp hơi khó chịu
        perl -pi -e "s/${search}/${replace}/g" "$file"
        echo "  -> Đã cập nhật file: $file"
    done
}

echo "=== BẮT ĐẦU CẬP NHẬT NỘI DUNG TỆP ==="
replace_contents "Echowave" "Pipewave"
replace_contents "echowave" "pipewave"
replace_contents "echo-wave" "pipewave"
replace_contents "Echo-wave" "Pipewave"
replace_contents "EchoWave" "Pipewave"

echo "=== HOÀN TẤT ĐỔI TÊN VÀ NỘI DUNG ==="
