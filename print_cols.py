import pandas as pd
df = pd.read_excel('backend/Student.xlsx')
print("EXCEL COLUMNS:")
print(df.columns.tolist())
