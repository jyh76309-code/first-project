import { NextRequest, NextResponse } from 'next/server'
import { deleteGeneration } from '@/lib/supabase'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: '缺少记录 ID', success: false },
        { status: 400 },
      )
    }

    await deleteGeneration(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除记录失败:', error)
    return NextResponse.json(
      { error: '删除失败，请重试', success: false },
      { status: 500 },
    )
  }
}
